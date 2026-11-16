import { SearchRepository } from '../repositories/search.repository.js';

export class SearchService {
  /**
   * Execute smart inventory search
   */
  static async searchProducts({ q = '', category, brand, status, page = 1, limit = 20 }) {
    const trimmedQuery = q ? q.trim() : '';

    const result = await SearchRepository.searchProducts({
      searchTerm: trimmedQuery,
      category,
      brand,
      status,
      page,
      limit
    });

    return {
      data: {
        query: result.query,
        totalProducts: result.totalProducts,
        totalStockUnits: result.totalStockUnits,
        products: result.products
      },
      meta: {
        ...result.meta,
        executionTimeMs: result.executionTimeMs
      }
    };
  }
}

