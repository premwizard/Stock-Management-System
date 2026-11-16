import { InventoryRepository } from '../repositories/inventory.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { getClient, isDatabaseAvailable } from '../config/database.js';
import { mockStore } from '../database/mockStore.js';

export class InventoryService {
  /**
   * Get paginated inventory list
   */
  static async getAllInventory(queryOptions) {
    return InventoryRepository.findAll(queryOptions);
  }

  /**
   * Get inventory details for a product with recent movements
   */
  static async getInventoryByProductId(productId) {
    const inventory = await InventoryRepository.findByProductId(productId);
    if (!inventory) {
      throw ApiError.notFound(`Inventory record for product ID '${productId}' not found`);
    }

    const recentMovements = await InventoryRepository.findMovementsByProductId(productId, 10);
    return {
      ...inventory,
      recentMovements
    };
  }

  /**
   * Add stock (Stock-IN) with atomic transaction and row-level locking
   */
  static async stockIn({ productId, quantity, reason }) {
    if (quantity <= 0) {
      throw ApiError.badRequest('Stock-in quantity must be greater than 0');
    }

    if (!isDatabaseAvailable()) {
      const current = mockStore.getProductById(productId);
      if (!current) {
        throw ApiError.notFound(`Product with ID '${productId}' not found in inventory`);
      }
      const previousQuantity = Number(current.quantity);
      const newQuantity = previousQuantity + Number(quantity);
      mockStore.updateStockQuantity(productId, newQuantity);
      mockStore.recordStockMovement({
        productId,
        movementType: 'IN',
        quantity,
        previousQuantity,
        newQuantity,
        reason
      });
      return mockStore.getInventoryByProductId(productId);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Row-lock current inventory record
      const current = await InventoryRepository.findByProductId(productId, client, true);
      if (!current) {
        throw ApiError.notFound(`Product with ID '${productId}' not found in inventory`);
      }

      const previousQuantity = Number(current.quantity);
      const newQuantity = previousQuantity + Number(quantity);

      // Update inventory table
      await InventoryRepository.updateQuantity(client, productId, newQuantity);

      // Record immutable stock movement
      await InventoryRepository.recordMovement(client, {
        productId,
        movementType: 'IN',
        quantity,
        previousQuantity,
        newQuantity,
        reason
      });

      await client.query('COMMIT');

      // Fetch refreshed inventory state
      return await InventoryRepository.findByProductId(productId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Remove stock (Stock-OUT) with atomic transaction, row-level locking, and negative stock prevention
   */
  static async stockOut({ productId, quantity, reason }) {
    if (quantity <= 0) {
      throw ApiError.badRequest('Stock-out quantity must be greater than 0');
    }

    if (!isDatabaseAvailable()) {
      const current = mockStore.getProductById(productId);
      if (!current) {
        throw ApiError.notFound(`Product with ID '${productId}' not found in inventory`);
      }
      const previousQuantity = Number(current.quantity);
      if (previousQuantity < quantity) {
        throw ApiError.badRequest(
          `Insufficient stock. Available units: ${previousQuantity}, requested reduction: ${quantity}`
        );
      }
      const newQuantity = previousQuantity - Number(quantity);
      mockStore.updateStockQuantity(productId, newQuantity);
      mockStore.recordStockMovement({
        productId,
        movementType: 'OUT',
        quantity,
        previousQuantity,
        newQuantity,
        reason
      });
      return mockStore.getInventoryByProductId(productId);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Row-lock current inventory record
      const current = await InventoryRepository.findByProductId(productId, client, true);
      if (!current) {
        throw ApiError.notFound(`Product with ID '${productId}' not found in inventory`);
      }

      const previousQuantity = Number(current.quantity);
      if (previousQuantity < quantity) {
        throw ApiError.badRequest(
          `Insufficient stock. Available units: ${previousQuantity}, requested reduction: ${quantity}`
        );
      }

      const newQuantity = previousQuantity - Number(quantity);

      // Update inventory table
      await InventoryRepository.updateQuantity(client, productId, newQuantity);

      // Record immutable stock movement
      await InventoryRepository.recordMovement(client, {
        productId,
        movementType: 'OUT',
        quantity,
        previousQuantity,
        newQuantity,
        reason
      });

      await client.query('COMMIT');

      // Fetch refreshed inventory state
      return await InventoryRepository.findByProductId(productId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Adjust stock to a specific target count with atomic transaction and row-level locking
   */
  static async adjustStock({ productId, newQuantity, reason }) {
    if (newQuantity < 0) {
      throw ApiError.badRequest('Target stock quantity cannot be negative');
    }

    if (!isDatabaseAvailable()) {
      const current = mockStore.getProductById(productId);
      if (!current) {
        throw ApiError.notFound(`Product with ID '${productId}' not found in inventory`);
      }
      const previousQuantity = Number(current.quantity);
      const delta = Math.abs(newQuantity - previousQuantity);
      mockStore.updateStockQuantity(productId, newQuantity);
      if (delta > 0) {
        mockStore.recordStockMovement({
          productId,
          movementType: 'ADJUSTMENT',
          quantity: delta,
          previousQuantity,
          newQuantity,
          reason
        });
      }
      return mockStore.getInventoryByProductId(productId);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Row-lock current inventory record
      const current = await InventoryRepository.findByProductId(productId, client, true);
      if (!current) {
        throw ApiError.notFound(`Product with ID '${productId}' not found in inventory`);
      }

      const previousQuantity = Number(current.quantity);
      const delta = Math.abs(newQuantity - previousQuantity);

      // Update inventory table
      await InventoryRepository.updateQuantity(client, productId, newQuantity);

      // Record movement if there was an actual adjustment delta
      if (delta > 0) {
        await InventoryRepository.recordMovement(client, {
          productId,
          movementType: 'ADJUSTMENT',
          quantity: delta,
          previousQuantity,
          newQuantity,
          reason
        });
      }

      await client.query('COMMIT');

      return await InventoryRepository.findByProductId(productId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get paginated audit trail of all stock movements
   */
  static async getMovements(queryOptions) {
    return InventoryRepository.findMovements(queryOptions);
  }
}
