import { InventoryService } from '../services/inventory.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class InventoryController {
  static getAll = asyncHandler(async (req, res) => {
    const { items, meta } = await InventoryService.getAllInventory(req.query);
    return ApiResponse.ok(res, items, 'Inventory levels retrieved successfully', meta);
  });

  static getByProductId = asyncHandler(async (req, res) => {
    const inventory = await InventoryService.getInventoryByProductId(req.params.productId);
    return ApiResponse.ok(res, inventory, 'Product inventory retrieved successfully');
  });

  static stockIn = asyncHandler(async (req, res) => {
    const updated = await InventoryService.stockIn(req.body);
    return ApiResponse.ok(res, updated, `Successfully added ${req.body.quantity} units to stock`);
  });

  static stockOut = asyncHandler(async (req, res) => {
    const updated = await InventoryService.stockOut(req.body);
    return ApiResponse.ok(res, updated, `Successfully removed ${req.body.quantity} units from stock`);
  });

  static adjust = asyncHandler(async (req, res) => {
    const updated = await InventoryService.adjustStock(req.body);
    return ApiResponse.ok(res, updated, `Successfully adjusted stock to ${req.body.newQuantity} units`);
  });

  static getMovements = asyncHandler(async (req, res) => {
    const { movements, meta } = await InventoryService.getMovements(req.query);
    return ApiResponse.ok(res, movements, 'Stock movements retrieved successfully', meta);
  });
}
