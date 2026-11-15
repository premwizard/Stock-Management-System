import { ProductRepository } from '../repositories/product.repository.js';
import { CategoryRepository } from '../repositories/category.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { getClient } from '../config/database.js';

export class ProductService {
  /**
   * Get all products with filters, search, sorting, and pagination
   */
  static async getAllProducts(queryOptions) {
    return ProductRepository.findAll(queryOptions);
  }

  /**
   * Get single product by ID
   */
  static async getProductById(id) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw ApiError.notFound(`Product with ID '${id}' not found`);
    }
    return product;
  }

  /**
   * Create new product and initialize stock atomically
   */
  static async createProduct(productData) {
    // 1. Validate category existence
    const category = await CategoryRepository.findById(productData.categoryId);
    if (!category) {
      throw ApiError.badRequest(`Category with ID '${productData.categoryId}' does not exist`);
    }

    // 2. Validate SKU uniqueness
    const existingSku = await ProductRepository.findBySku(productData.sku);
    if (existingSku) {
      throw ApiError.conflict(`A product with SKU '${productData.sku}' already exists`);
    }

    // 3. Atomically insert product, inventory, and initial stock movement
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const created = await ProductRepository.createWithInventory(client, productData);
      await client.query('COMMIT');

      // Return fully hydrated product
      return await ProductRepository.findById(created.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update product metadata
   */
  static async updateProduct(id, updateData) {
    const existing = await ProductRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Product with ID '${id}' not found`);
    }

    if (updateData.categoryId) {
      const category = await CategoryRepository.findById(updateData.categoryId);
      if (!category) {
        throw ApiError.badRequest(`Category with ID '${updateData.categoryId}' does not exist`);
      }
    }

    const updated = await ProductRepository.update(id, updateData);
    return updated;
  }

  /**
   * Delete product
   */
  static async deleteProduct(id) {
    const existing = await ProductRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Product with ID '${id}' not found`);
    }

    return ProductRepository.delete(id);
  }
}

