import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { productService } from '../../services/product.service';
import { useQueryClient } from '@tanstack/react-query';

export const ProductFormModal = ({
  isOpen,
  onClose,
  product = null,
  categories = []
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brand: 'Generic',
    description: '',
    unit: 'pcs',
    imageUrl: '',
    minimumStock: 10,
    initialStock: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        categoryId: product.category_id || '',
        brand: product.brand || 'Generic',
        description: product.description || '',
        unit: product.unit || 'pcs',
        imageUrl: product.image_url || '',
        minimumStock: product.minimum_stock ?? 10,
        initialStock: 0
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        categoryId: categories[0]?.id || '',
        brand: '',
        description: '',
        unit: 'pcs',
        imageUrl: '',
        minimumStock: 10,
        initialStock: 0
      });
    }
    setErrors({});
  }, [product, categories, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU is required';
    if (!formData.categoryId) errs.categoryId = 'Category selection is required';
    if (formData.minimumStock < 0) errs.minimumStock = 'Minimum stock cannot be negative';
    if (!isEditing && formData.initialStock < 0) errs.initialStock = 'Initial stock cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await productService.update(product.id, {
          name: formData.name,
          categoryId: formData.categoryId,
          brand: formData.brand,
          description: formData.description,
          unit: formData.unit,
          imageUrl: formData.imageUrl,
          minimumStock: Number(formData.minimumStock)
        });
      } else {
        await productService.create({
          name: formData.name,
          sku: formData.sku,
          categoryId: formData.categoryId,
          brand: formData.brand || 'Generic',
          description: formData.description,
          unit: formData.unit || 'pcs',
          imageUrl: formData.imageUrl,
          minimumStock: Number(formData.minimumStock),
          initialStock: Number(formData.initialStock)
        });
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      subtitle={isEditing ? `Update details for SKU: ${product?.sku}` : 'Register a new automotive item into warehouse catalogue'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Michelin Primacy 4 Tyre"
          />

          <Input
            label="SKU Code *"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            error={errors.sku}
            disabled={isEditing}
            placeholder="e.g. TYR-001"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Category *"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            options={categoryOptions}
            error={errors.categoryId}
          />

          <Input
            label="Manufacturer Brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g. Michelin, Bosch, Brembo"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Unit of Measurement"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            placeholder="pcs, sets, liters, pairs"
          />

          <Input
            label="Minimum Stock Threshold"
            name="minimumStock"
            type="number"
            min="0"
            value={formData.minimumStock}
            onChange={handleChange}
            error={errors.minimumStock}
          />

          {!isEditing && (
            <Input
              label="Initial Warehouse Stock"
              name="initialStock"
              type="number"
              min="0"
              value={formData.initialStock}
              onChange={handleChange}
              error={errors.initialStock}
            />
          )}
        </div>

        <Input
          label="Product Image URL (Optional)"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://images.unsplash.com/..."
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Provide specifications, vehicle compatibility, or part attributes..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

