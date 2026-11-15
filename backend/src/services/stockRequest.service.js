import { StockRequestRepository } from '../repositories/stockRequest.repository.js';
import { InventoryRepository } from '../repositories/inventory.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { getClient } from '../config/database.js';

export class StockRequestService {
  /**
   * Create a new draft stock request
   */
  static async createRequest({ notes, items }) {
    if (!items || items.length === 0) {
      throw ApiError.badRequest('Stock request must contain at least one product item');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Verify that all product IDs exist and are active
      const productIds = items.map((i) => i.productId).sort();
      const productCheckSql = `
        SELECT id, name, is_active
        FROM products
        WHERE id = ANY($1::uuid[]);
      `;
      const productCheckRes = await client.query(productCheckSql, [productIds]);
      const foundProductsMap = new Map(productCheckRes.rows.map((p) => [p.id, p]));

      for (const item of items) {
        const prod = foundProductsMap.get(item.productId);
        if (!prod) {
          throw ApiError.notFound(`Product with ID '${item.productId}' not found in catalogue`);
        }
        if (!prod.is_active) {
          throw ApiError.badRequest(`Product '${prod.name}' is inactive and cannot be requested`);
        }
      }

      // Generate unique human-readable request number
      const requestNumber = await StockRequestRepository.generateRequestNumber(client);

      // Create draft request and items
      const created = await StockRequestRepository.create(client, {
        requestNumber,
        notes,
        items
      });

      await client.query('COMMIT');

      // Return fully hydrated request
      return await StockRequestRepository.findById(created.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get all paginated stock requests
   */
  static async getAllRequests(queryOptions) {
    return StockRequestRepository.findAll(queryOptions);
  }

  /**
   * Get stock request details by ID
   */
  static async getRequestById(id) {
    const request = await StockRequestRepository.findById(id);
    if (!request) {
      throw ApiError.notFound(`Stock request with ID '${id}' not found`);
    }
    return request;
  }

  /**
   * Update items/notes on an unconfirmed DRAFT stock request
   */
  static async updateRequest(id, { notes, items }) {
    if (!items || items.length === 0) {
      throw ApiError.badRequest('Stock request must contain at least one product item');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Lock the request row
      const existing = await StockRequestRepository.findForUpdate(client, id);
      if (!existing) {
        throw ApiError.notFound(`Stock request with ID '${id}' not found`);
      }

      if (existing.status !== 'DRAFT') {
        throw ApiError.badRequest(`Only DRAFT stock requests can be edited. Current status: ${existing.status}`);
      }

      // Verify replacement products
      const productIds = items.map((i) => i.productId).sort();
      const productCheckSql = `
        SELECT id, name, is_active
        FROM products
        WHERE id = ANY($1::uuid[]);
      `;
      const productCheckRes = await client.query(productCheckSql, [productIds]);
      const foundProductsMap = new Map(productCheckRes.rows.map((p) => [p.id, p]));

      for (const item of items) {
        const prod = foundProductsMap.get(item.productId);
        if (!prod) {
          throw ApiError.notFound(`Product with ID '${item.productId}' not found in catalogue`);
        }
        if (!prod.is_active) {
          throw ApiError.badRequest(`Product '${prod.name}' is inactive and cannot be requested`);
        }
      }

      await StockRequestRepository.updateDraft(client, id, { notes, items });

      await client.query('COMMIT');
      return await StockRequestRepository.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm stock request and execute atomic inventory deduction
   * Concurrency-safe:
   * 1. Locks the stock_request row (FOR UPDATE) to prevent duplicate confirmations
   * 2. Sorts product IDs ascending and locks inventory rows (FOR UPDATE) to eliminate deadlocks
   * 3. Validates stock sufficiency across ALL items before making any modifications
   * 4. Deducts stock, writes OUT movements, records snapshots, updates status to CONFIRMED
   */
  static async confirmRequest(id) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock the stock request record
      const request = await StockRequestRepository.findForUpdate(client, id);
      if (!request) {
        throw ApiError.notFound(`Stock request with ID '${id}' not found`);
      }

      if (request.status === 'CONFIRMED') {
        throw ApiError.conflict(`Stock request '${request.request_number}' is already confirmed`);
      }

      if (request.status === 'CANCELLED') {
        throw ApiError.badRequest(`Cannot confirm cancelled stock request '${request.request_number}'`);
      }

      if (request.status !== 'DRAFT') {
        throw ApiError.badRequest(`Stock request cannot be confirmed from status '${request.status}'`);
      }

      // 2. Fetch line items
      const requestDetails = await StockRequestRepository.findById(id, client);
      const items = requestDetails?.items || [];

      if (items.length === 0) {
        throw ApiError.badRequest('Cannot confirm an empty stock request');
      }

      // 3. Extract and sort product IDs to guarantee consistent locking order
      const productIds = items.map((i) => i.product_id).sort();

      // 4. Lock inventory records in ascending order
      const lockedInventory = await StockRequestRepository.lockAndValidateInventory(client, productIds);
      const inventoryMap = new Map(lockedInventory.map((row) => [row.product_id, row]));

      // 5. Validate that all items exist, are active, and have sufficient stock
      const validationFailures = [];
      for (const item of items) {
        const inv = inventoryMap.get(item.product_id);
        if (!inv) {
          validationFailures.push({
            productId: item.product_id,
            productName: item.product_name,
            reason: 'Product record missing from inventory'
          });
        } else if (!inv.is_active) {
          validationFailures.push({
            productId: item.product_id,
            productName: inv.product_name,
            reason: 'Product is marked inactive in catalogue'
          });
        } else if (Number(inv.quantity) < Number(item.requested_quantity)) {
          validationFailures.push({
            productId: item.product_id,
            productName: inv.product_name,
            sku: inv.sku,
            requestedQuantity: Number(item.requested_quantity),
            availableQuantity: Number(inv.quantity),
            reason: `Insufficient inventory: requested ${item.requested_quantity} ${inv.unit}, only ${inv.quantity} available`
          });
        }
      }

      if (validationFailures.length > 0) {
        throw ApiError.badRequest(
          `Stock request '${request.request_number}' cannot be confirmed due to inventory constraints`,
          validationFailures
        );
      }

      // 6. Execute atomic deduction, stock movement logging, and snapshot storage
      for (const item of items) {
        const inv = inventoryMap.get(item.product_id);
        const currentQty = Number(inv.quantity);
        const deductQty = Number(item.requested_quantity);
        const newQty = currentQty - deductQty;

        // Deduct inventory
        await InventoryRepository.updateQuantity(client, item.product_id, newQty);

        // Record immutable OUT movement referencing this stock request
        await InventoryRepository.recordMovement(client, {
          productId: item.product_id,
          movementType: 'OUT',
          quantity: deductQty,
          previousQuantity: currentQty,
          newQuantity: newQty,
          reason: `Stock Request ${request.request_number}`,
          stockRequestId: request.id
        });

        // Store snapshot of available quantity at confirmation
        await StockRequestRepository.updateItemConfirmationSnapshot(
          client,
          item.item_id,
          currentQty
        );
      }

      // 7. Transition request status to CONFIRMED
      await StockRequestRepository.setConfirmed(client, id);

      // 8. Commit atomic transaction
      await client.query('COMMIT');

      // Return fully hydrated updated request
      return await StockRequestRepository.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel an unconfirmed DRAFT stock request
   */
  static async cancelRequest(id) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const existing = await StockRequestRepository.findForUpdate(client, id);
      if (!existing) {
        throw ApiError.notFound(`Stock request with ID '${id}' not found`);
      }

      if (existing.status === 'CONFIRMED') {
        throw ApiError.badRequest('Cannot cancel an already confirmed stock request. Inventory has already been deducted.');
      }

      if (existing.status === 'CANCELLED') {
        throw ApiError.badRequest('Stock request is already cancelled.');
      }

      await StockRequestRepository.setCancelled(client, id);

      await client.query('COMMIT');
      return await StockRequestRepository.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
