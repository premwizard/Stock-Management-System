import { CategoryService } from '../services/category.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class CategoryController {
  static getAll = asyncHandler(async (req, res) => {
    const withStats = req.query.withStats === 'true' || req.query.withStats === true;
    const categories = await CategoryService.getAllCategories(withStats);
    return ApiResponse.ok(res, categories, 'Categories retrieved successfully');
  });

  static getById = asyncHandler(async (req, res) => {
    const category = await CategoryService.getCategoryById(req.params.id);
    return ApiResponse.ok(res, category, 'Category details retrieved');
  });

  static create = asyncHandler(async (req, res) => {
    const category = await CategoryService.createCategory(req.body);
    return ApiResponse.created(res, category, 'Category created successfully');
  });

  static update = asyncHandler(async (req, res) => {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    return ApiResponse.ok(res, category, 'Category updated successfully');
  });

  static delete = asyncHandler(async (req, res) => {
    const result = await CategoryService.deleteCategory(req.params.id);
    return ApiResponse.ok(res, result, 'Category deleted successfully');
  });
}

