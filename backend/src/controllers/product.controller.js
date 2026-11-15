import { ProductService } from '../services/product.service.js';
import { SearchService } from '../services/search.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class ProductController {
  static getAll = asyncHandler(async (req, res) => {
    const { products, meta } = await ProductService.getAllProducts(req.query);
    return ApiResponse.ok(res, products, 'Products retrieved successfully', meta);
  });

  static search = asyncHandler(async (req, res) => {
    const { data, meta } = await SearchService.searchProducts(req.query);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Smart search results retrieved successfully',
      data,
      meta
    });
  });

  static getById = asyncHandler(async (req, res) => {
    const product = await ProductService.getProductById(req.params.id);
    return ApiResponse.ok(res, product, 'Product details retrieved');
  });

  static create = asyncHandler(async (req, res) => {
    const product = await ProductService.createProduct(req.body);
    return ApiResponse.created(res, product, 'Product created successfully');
  });

  static update = asyncHandler(async (req, res) => {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    return ApiResponse.ok(res, product, 'Product updated successfully');
  });

  static delete = asyncHandler(async (req, res) => {
    const result = await ProductService.deleteProduct(req.params.id);
    return ApiResponse.ok(res, result, 'Product deleted successfully');
  });
}
