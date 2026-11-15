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
    if (!isOpen) return;

    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        categoryId: product.category_id || product.categoryId || (categories[0]?.id || ''),
        brand: product.brand || 'Generic',
        description: product.description || '',
        unit: product.unit || 'pcs',
        imageUrl: product.image_url || product.imageUrl || '',
        minimumStock: product.minimum_stock ?? product.minimumStock ?? 10,
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
  }, [isOpen, product, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Product name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Product name must be at least 2 characters';
    }

    if (!isEditing) {
      if (!formData.sku.trim()) {
        errs.sku = 'SKU is required';
      } else if (formData.sku.trim().length < 2) {
        errs.sku = 'SKU must be at least 2 characters';
      } else if (!/^[A-Za-z0-9-_]+$/.test(formData.sku.trim())) {
        errs.sku = 'SKU may only contain letters, numbers, hyphens, and underscores';
      }
    }

    if (!formData.categoryId) {
      errs.categoryId = 'Category selection is required';
    }

    if (formData.minimumStock === '' || Number(formData.minimumStock) < 0) {
      errs.minimumStock = 'Minimum stock must be 0 or greater';
    }

    if (!isEditing && (formData.initialStock === '' || Number(formData.initialStock) < 0)) {
      errs.initialStock = 'Initial stock cannot be negative';
    }

    if (formData.imageUrl && formData.imageUrl.trim()) {
      const urlCandidate = formData.imageUrl.trim();
      const testUrl = /^https?:\/\//i.test(urlCandidate) || urlCandidate.startsWith('/') || urlCandidate.startsWith('data:image')
        ? urlCandidate
        : `https://${urlCandidate}`;
      try {
        if (!testUrl.startsWith('data:image')) {
          new window.URL(testUrl.startsWith('/') ? `http://localhost${testUrl}` : testUrl);
        }
      } catch {
        errs.imageUrl = 'Please enter a valid image URL or leave blank';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const cleanedImageUrl = formData.imageUrl?.trim() || '';
    const payload = {
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      brand: formData.brand?.trim() || 'Generic',
      description: formData.description?.trim() || '',
      unit: formData.unit?.trim() || 'pcs',
      imageUrl: cleanedImageUrl,
      minimumStock: Math.max(0, parseInt(formData.minimumStock, 10) || 0)
    };

    try {
      if (isEditing) {
        await productService.update(product.id, payload);
      } else {
        await productService.create({
          ...payload,
          sku: formData.sku.trim().toUpperCase(),
          initialStock: Math.max(0, parseInt(formData.initialStock, 10) || 0)
        });
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    } catch (err) {
      const fieldErrors = {};
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        err.errors.forEach((e) => {
          if (e.field) {
            fieldErrors[e.field] = e.message;
          }
        });
        const details = err.errors.map((e) => e.message).join(' • ');
        fieldErrors.form = `Validation Error: ${details}`;
      } else {
        fieldErrors.form = err.message || 'Failed to save product';
      }
      setErrors(fieldErrors);
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
            placeholder="-- Choose Category --"
          />

          <Input
            label="Manufacturer Brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            error={errors.brand}
            placeholder="e.g. Michelin, Bosch, Brembo"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Unit of Measurement"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            error={errors.unit}
            placeholder="pcs, sets, liters, pairs"
          />

          <Input
            label="Minimum Stock Threshold"
            name="minimumStock"
            type="number"
            inputMode="numeric"
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
              inputMode="numeric"
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
          error={errors.imageUrl}
          placeholder="https://images.unsplash.com/..."
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
            placeholder="Provide specifications, vehicle compatibility, or part attributes..."
          />
          {errors.description && (
            <p className="text-xs text-rose-600 font-semibold">{errors.description}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
