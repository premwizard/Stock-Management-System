import { VehiclePackageRepository } from '../repositories/vehiclePackage.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { getClient } from '../config/database.js';

export class VehiclePackageService {
  /**
   * List all vehicle packages with pagination and optional search/status filters
   */
  static async getAllPackages(queryOptions) {
    return VehiclePackageRepository.findAll(queryOptions);
  }

  /**
   * Get single vehicle package by ID with components and stock availability
   */
  static async getPackageById(id) {
    const pkg = await VehiclePackageRepository.findById(id);
    if (!pkg) {
      throw ApiError.notFound(`Vehicle package with ID '${id}' not found`);
    }
    return pkg;
  }

  /**
   * Create a new vehicle package
   */
  static async createPackage({ name, description, isActive = true, items }) {
    if (!items || items.length === 0) {
      throw ApiError.badRequest('Vehicle package must contain at least one component product');
    }

    // Check duplicate package name
    const existingName = await VehiclePackageRepository.findByName(name);
    if (existingName) {
      throw ApiError.conflict(`Vehicle package with name '${name.trim()}' already exists`);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Verify all product IDs exist and are active
      const productIds = items.map((i) => i.productId);
      const productCheckSql = `
        SELECT id, name, is_active
        FROM products
        WHERE id = ANY($1::uuid[]);
      `;
      const productCheckRes = await client.query(productCheckSql, [productIds]);
      const productMap = new Map(productCheckRes.rows.map((p) => [p.id, p]));

      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod) {
          throw ApiError.notFound(`Product with ID '${item.productId}' not found in catalogue`);
        }
        if (!prod.is_active) {
          throw ApiError.badRequest(`Product '${prod.name}' is inactive and cannot be added to a package`);
        }
      }

      const created = await VehiclePackageRepository.create(client, {
        name,
        description,
        isActive,
        items
      });

      await client.query('COMMIT');
      return await VehiclePackageRepository.findById(created.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing vehicle package
   */
  static async updatePackage(id, { name, description, isActive, items }) {
    const existing = await VehiclePackageRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Vehicle package with ID '${id}' not found`);
    }

    if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await VehiclePackageRepository.findByName(name, id);
      if (duplicate) {
        throw ApiError.conflict(`Vehicle package with name '${name.trim()}' already exists`);
      }
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      if (items && items.length > 0) {
        const productIds = items.map((i) => i.productId);
        const productCheckSql = `
          SELECT id, name, is_active
          FROM products
          WHERE id = ANY($1::uuid[]);
        `;
        const productCheckRes = await client.query(productCheckSql, [productIds]);
        const productMap = new Map(productCheckRes.rows.map((p) => [p.id, p]));

        for (const item of items) {
          const prod = productMap.get(item.productId);
          if (!prod) {
            throw ApiError.notFound(`Product with ID '${item.productId}' not found in catalogue`);
          }
          if (!prod.is_active) {
            throw ApiError.badRequest(`Product '${prod.name}' is inactive and cannot be in a package`);
          }
        }
      }

      const updated = await VehiclePackageRepository.update(client, id, {
        name,
        description,
        isActive,
        items
      });

      await client.query('COMMIT');
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a vehicle package
   */
  static async deletePackage(id) {
    const existing = await VehiclePackageRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Vehicle package with ID '${id}' not found`);
    }

    const deleted = await VehiclePackageRepository.delete(id);
    return deleted;
  }

  /**
   * Expand a package into its constituent products with a vehicle multiplier (e.g. 1, 2, 5 vehicles)
   * Calculates required quantities validated against the saved PostgreSQL template.
   */
  static async expandPackage(id, multiplier = 1) {
    const mult = Math.max(1, Math.floor(Number(multiplier) || 1));
    const pkg = await VehiclePackageRepository.findById(id);
    if (!pkg) {
      throw ApiError.notFound(`Vehicle package with ID '${id}' not found`);
    }

    if (!pkg.is_active) {
      throw ApiError.badRequest(`Vehicle package '${pkg.name}' is inactive and cannot be added to checkout`);
    }

    const items = pkg.items || [];
    const expandedItems = items.map((item) => {
      const requiredPerVehicle = Number(item.required_quantity);
      const totalRequested = requiredPerVehicle * mult;
      const avail = Number(item.available_quantity);
      const sufficient = avail >= totalRequested;
      const deficit = sufficient ? 0 : totalRequested - avail;

      return {
        productId: item.product_id,
        name: item.product_name,
        sku: item.sku,
        brand: item.brand,
        category: item.category_name,
        unit: item.unit,
        imageUrl: item.image_url,
        requiredPerVehicle,
        requestedQuantity: totalRequested,
        availableQuantity: avail,
        sufficientStock: sufficient,
        deficit,
        stockStatus: item.stock_status,
        packageId: pkg.id,
        packageName: pkg.name
      };
    });

    const allSufficient = expandedItems.every((i) => i.sufficientStock);

    return {
      packageId: pkg.id,
      packageName: pkg.name,
      description: pkg.description,
      multiplier: mult,
      totalItems: expandedItems.length,
      totalUnits: expandedItems.reduce((acc, curr) => acc + curr.requestedQuantity, 0),
      allSufficient,
      items: expandedItems
    };
  }
}
