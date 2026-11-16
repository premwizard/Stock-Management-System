import { Router } from 'express';
import { VehiclePackageController } from '../controllers/vehiclePackage.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createVehiclePackageSchema,
  updateVehiclePackageSchema,
  listVehiclePackagesQuerySchema,
  vehiclePackageIdParamSchema,
  expandPackageQuerySchema
} from '../validators/vehiclePackage.validator.js';

const router = Router();

// List vehicle packages
router.get(
  '/',
  validate(listVehiclePackagesQuerySchema, 'query'),
  VehiclePackageController.getAll
);

// Create a vehicle package
router.post(
  '/',
  validate(createVehiclePackageSchema, 'body'),
  VehiclePackageController.create
);

// Expand package with vehicle multiplier (for checkout preview & cart addition)
router.get(
  '/:id/expand',
  validate(vehiclePackageIdParamSchema, 'params'),
  validate(expandPackageQuerySchema, 'query'),
  VehiclePackageController.expand
);

// Get single package details with components & stock
router.get(
  '/:id',
  validate(vehiclePackageIdParamSchema, 'params'),
  VehiclePackageController.getById
);

// Update package metadata or components
router.put(
  '/:id',
  validate(vehiclePackageIdParamSchema, 'params'),
  validate(updateVehiclePackageSchema, 'body'),
  VehiclePackageController.update
);

// Delete vehicle package
router.delete(
  '/:id',
  validate(vehiclePackageIdParamSchema, 'params'),
  VehiclePackageController.delete
);

export default router;
