import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/category.service';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { formatNumber, formatDate } from '../utils/formatters';
import { FolderTree, Plus, Edit2, Trash2, Package, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Categories() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['categories-list-stats'],
    queryFn: () => categoryService.getAll(true)
  });

  const categories = data?.data || [];

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, {
          name: name.trim(),
          description: description.trim()
        });
      } else {
        await categoryService.create({
          name: name.trim(),
          description: description.trim()
        });
      }

      queryClient.invalidateQueries({ queryKey: ['categories-list-stats'] });
      queryClient.invalidateQueries({ queryKey: ['categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-distribution'] });

      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (window.confirm(`Are you sure you want to delete category '${catName}'?`)) {
      try {
        await categoryService.delete(id);
        queryClient.invalidateQueries({ queryKey: ['categories-list-stats'] });
        queryClient.invalidateQueries({ queryKey: ['categories-all'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      } catch (err) {
        alert(err.message || 'Cannot delete category');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize automotive components, assign product hierarchies, and track category inventory totals.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAdd}>
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse border border-slate-200">
              <div className="h-5 w-32 bg-slate-200 rounded"></div>
              <div className="h-12 w-full bg-slate-200 rounded"></div>
              <div className="h-8 w-full bg-slate-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No Categories Available"
          description="Create your first inventory category to start organizing products."
          actionLabel="Create Category"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-6 flex flex-col justify-between hover:shadow-card-hover border border-slate-200/80 bg-white transition-all duration-200">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shadow-2xs">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Added {formatDate(cat.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 min-h-[2rem] leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span>Products</span>
                    </div>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">
                      {formatNumber(cat.product_count)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Total Stock</span>
                    </div>
                    <p className="text-lg font-black text-indigo-600 font-mono mt-1">
                      {formatNumber(cat.total_stock_units)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-medium">
                  {formatNumber(cat.total_stock_units)} units available
                </span>
                <Link
                  to={`/inventory?category=${encodeURIComponent(cat.name)}`}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <span>Explore Items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Category Creation / Editing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        subtitle={editingCategory ? `Update details for '${editingCategory.name}'` : 'Add a new product classification'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
              {error}
            </div>
          )}

          <Input
            label="Category Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tyres, Car Parts, Lubricants"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              placeholder="Describe products belonging to this category..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
