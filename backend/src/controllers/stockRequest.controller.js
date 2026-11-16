import { StockRequestService } from '../services/stockRequest.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class StockRequestController {
  /**
   * Preview and verify current inventory availability for requested items (read-only)
   */
  static verify = asyncHandler(async (req, res) => {
    const result = await StockRequestService.verifyStock(req.body);
    const message = result.verified
      ? 'All requested product quantities are available in warehouse inventory'
      : 'One or more items have insufficient stock or are unavailable';
    return ApiResponse.ok(res, result, message);
  });

  /**
   * Create draft stock request
   */
  static create = asyncHandler(async (req, res) => {
    const request = await StockRequestService.createRequest(req.body);
    return ApiResponse.created(res, request, `Stock request '${request.request_number}' created as DRAFT`);
  });

  /**
   * List paginated stock requests
   */
  static getAll = asyncHandler(async (req, res) => {
    const { items, meta } = await StockRequestService.getAllRequests(req.query);
    return ApiResponse.ok(res, items, 'Stock requests retrieved successfully', meta);
  });

  /**
   * Get single stock request by ID
   */
  static getById = asyncHandler(async (req, res) => {
    const request = await StockRequestService.getRequestById(req.params.id);
    return ApiResponse.ok(res, request, 'Stock request details retrieved successfully');
  });

  /**
   * Update draft stock request
   */
  static update = asyncHandler(async (req, res) => {
    const request = await StockRequestService.updateRequest(req.params.id, req.body);
    return ApiResponse.ok(res, request, `Stock request '${request.request_number}' updated successfully`);
  });

  /**
   * Confirm stock request and execute automatic inventory deduction
   */
  static confirm = asyncHandler(async (req, res) => {
    const request = await StockRequestService.confirmRequest(req.params.id);
    return ApiResponse.ok(
      res,
      request,
      `Stock request '${request.request_number}' confirmed and inventory deducted successfully`
    );
  });

  /**
   * Cancel draft stock request
   */
  static cancel = asyncHandler(async (req, res) => {
    const request = await StockRequestService.cancelRequest(req.params.id);
    return ApiResponse.ok(res, request, `Stock request '${request.request_number}' cancelled successfully`);
  });
}

