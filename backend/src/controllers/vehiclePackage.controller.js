import { VehiclePackageService } from '../services/vehiclePackage.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class VehiclePackageController {
  static getAll = asyncHandler(async (req, res) => {
    const { page, limit, search, isActive } = req.query;
    const result = await VehiclePackageService.getAllPackages({
      page,
      limit,
      search,
      isActive
    });

    return ApiResponse.ok(
      res,
      result.packages,
      'Vehicle packages retrieved successfully',
      result.meta
    );
  });

  static getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const pkg = await VehiclePackageService.getPackageById(id);
    return ApiResponse.ok(res, pkg, 'Vehicle package retrieved successfully');
  });

  static expand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { multiplier } = req.query;
    const result = await VehiclePackageService.expandPackage(id, multiplier);
    return ApiResponse.ok(res, result, 'Vehicle package expanded successfully');
  });

  static create = asyncHandler(async (req, res) => {
    const { name, description, isActive, items } = req.body;
    const created = await VehiclePackageService.createPackage({
      name,
      description,
      isActive,
      items
    });
    return ApiResponse.created(res, created, 'Vehicle package created successfully');
  });

  static update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, isActive, items } = req.body;
    const updated = await VehiclePackageService.updatePackage(id, {
      name,
      description,
      isActive,
      items
    });
    return ApiResponse.ok(res, updated, 'Vehicle package updated successfully');
  });

  static delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await VehiclePackageService.deletePackage(id);
    return ApiResponse.ok(res, deleted, 'Vehicle package deleted successfully');
  });
}
