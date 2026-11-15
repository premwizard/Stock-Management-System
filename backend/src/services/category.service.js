import { CategoryRepository } from '../repositories/category.repository.js';
import { ApiError } from '../utils/ApiError.js';

export class CategoryService {
  /**
   * Get all categories, optionally with product counts & stock totals
   */
  static async getAllCategories(withStats = false) {
    return CategoryRepository.findAll(withStats);
  }

  /**
   * Get category by ID with its products
   */
  static async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw ApiError.notFound(`Category with ID '${id}' not found`);
    }

    const { ProductRepository } = await import('../repositories/product.repository.js');
    const products = await ProductRepository.findByCategoryId(id);

    return {
      ...category,
      products
    };
  }

  /**
   * Create a new category
   */
  static async createCategory({ name, description }) {
    const existing = await CategoryRepository.findByName(name);
    if (existing) {
      throw ApiError.conflict(`A category with the name '${name}' already exists`);
    }

    return CategoryRepository.create({ name, description });
  }

  /**
   * Update category
   */
  static async updateCategory(id, { name, description }) {
    const existing = await CategoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Category with ID '${id}' not found`);
    }

    if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await CategoryRepository.findByName(name);
      if (duplicate) {
        throw ApiError.conflict(`A category with the name '${name}' already exists`);
      }
    }

    return CategoryRepository.update(id, { name, description });
  }

  /**
   * Delete category safely (fails if products exist)
   */
  static async deleteCategory(id) {
    const existing = await CategoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Category with ID '${id}' not found`);
    }

    const productCount = await CategoryRepository.countProductsByCategoryId(id);
    if (productCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category '${existing.name}' because it contains ${productCount} associated product(s). Reassign or delete products first.`
      );
    }

    return CategoryRepository.delete(id);
  }
}

