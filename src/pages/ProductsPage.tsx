import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Layers, 
  Plus, 
  ShoppingBag 
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import type { Product, Category } from '../types';
import { ProductFilterBar, type ProductFilters } from '../components/products/ProductFilterBar';
import { ProductTable } from '../components/products/ProductTable';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductDetailDrawer } from '../components/products/ProductDetailDrawer';
import { CategoryList } from '../components/categories/CategoryList';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { getStockStatus } from '../utils/productHelpers';

export const ProductsPage: React.FC = () => {
  const {
    products,
    categories,
    setCurrentPage,
    addProduct,
    updateProduct,
    toggleProductStatus,
    addCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
    isCategoryInUse,
    addToast,
  } = usePos();

  // Active top tab
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Filter state for products
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoryId: 'all',
    status: 'all',
    stockStatus: 'all',
    sortBy: 'updated-desc',
  });

  // Modal & Drawer states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Confirm modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Reset filter
  const handleResetFilters = () => {
    setFilters({
      search: '',
      categoryId: 'all',
      status: 'all',
      stockStatus: 'all',
      sortBy: 'updated-desc',
    });
  };

  // Filtered and Sorted products (does NOT mutate IndexedDB)
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // 1. Search by name or SKU
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      // 2. Category filter
      const matchCat =
        filters.categoryId === 'all' || p.categoryId === filters.categoryId;

      // 3. Status filter
      const matchStatus =
        filters.status === 'all' ||
        (filters.status === 'active' && p.isActive) ||
        (filters.status === 'inactive' && !p.isActive);

      // 4. Stock status filter
      const currentStockStatus = getStockStatus(p);
      const matchStock =
        filters.stockStatus === 'all' || currentStockStatus === filters.stockStatus;

      return matchSearch && matchCat && matchStatus && matchStock;
    });

    // 5. Sorting
    result = [...result].sort((a, b) => {
      switch (filters.sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        case 'updated-desc':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [products, filters]);

  // Product Actions Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product
  ) => {
    if ('id' in productData) {
      return await updateProduct(productData as Product);
    } else {
      return await addProduct(productData);
    }
  };

  const handleToggleProductStatus = (product: Product) => {
    if (product.isActive) {
      setConfirmDialog({
        isOpen: true,
        title: 'Nonaktifkan Produk Ini?',
        message: `Produk "${product.name}" (${product.sku}) akan dinonaktifkan. Produk tidak akan muncul di layar POS/Kasir tetapi riwayat transaksi tetap terjaga.`,
        confirmLabel: 'Nonaktifkan',
        isDestructive: true,
        onConfirm: async () => {
          await toggleProductStatus(product.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (selectedProductDetail?.id === product.id) {
            setSelectedProductDetail((prev) => prev ? { ...prev, isActive: false } : null);
          }
        },
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Aktifkan Produk Kembali?',
        message: `Produk "${product.name}" (${product.sku}) akan diaktifkan kembali dan dapat dipilih di layar POS/Kasir.`,
        confirmLabel: 'Aktifkan',
        isDestructive: false,
        onConfirm: async () => {
          await toggleProductStatus(product.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (selectedProductDetail?.id === product.id) {
            setSelectedProductDetail((prev) => prev ? { ...prev, isActive: true } : null);
          }
        },
      });
    }
  };

  // Category Actions Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (
    categoryData: Omit<Category, 'id'> | Category
  ) => {
    if ('id' in categoryData) {
      return await updateCategory(categoryData as Category);
    } else {
      return await addCategory(categoryData);
    }
  };

  const handleToggleCategoryStatus = (category: Category) => {
    if (category.isActive) {
      setConfirmDialog({
        isOpen: true,
        title: 'Nonaktifkan Kategori?',
        message: `Kategori "${category.name}" akan dinonaktifkan. Kategori ini tidak dapat dipilih saat membuat produk baru, namun produk yang sudah ada tetap aman.`,
        confirmLabel: 'Nonaktifkan',
        isDestructive: true,
        onConfirm: async () => {
          await toggleCategoryStatus(category.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Aktifkan Kategori Kembali?',
        message: `Kategori "${category.name}" akan diaktifkan kembali.`,
        confirmLabel: 'Aktifkan',
        isDestructive: false,
        onConfirm: async () => {
          await toggleCategoryStatus(category.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    }
  };

  const handleDeleteCategory = (category: Category) => {
    const inUse = isCategoryInUse(category.id);
    if (inUse) {
      setConfirmDialog({
        isOpen: true,
        title: 'Tidak Dapat Menghapus Kategori',
        message: `Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh produk di katalog. Anda disarankan untuk menonaktifkannya saja agar tidak mengganggu relasi data.`,
        confirmLabel: 'Mengerti',
        isDestructive: false,
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Kategori Permanen?',
      message: `Apakah Anda yakin ingin menghapus kategori "${category.name}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Permanen',
      isDestructive: true,
      onConfirm: async () => {
        const res = await deleteCategory(category.id);
        if (!res.success) {
          addToast(res.error || 'Gagal menghapus kategori', 'error');
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="page-container">
      {/* Subheader */}
      <div className="page-subheader">
        <div className="subheader-title-group">
          <h2>
            <Package size={20} color="var(--primary-light)" />
            <span>Master Data Merchandise & Kategori</span>
          </h2>
          <div className="subheader-subtitle">
            Kelola katalog produk, SKU, variasi harga modal, margin laba, dan kategori booth
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeTab === 'products' ? (
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--primary)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 10px var(--primary-glow)',
                cursor: 'pointer',
              }}
              onClick={handleOpenAddProduct}
            >
              <Plus size={15} />
              <span>Tambah Produk Baru</span>
            </button>
          ) : (
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--primary)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 10px var(--primary-glow)',
                cursor: 'pointer',
              }}
              onClick={handleOpenAddCategory}
            >
              <Plus size={15} />
              <span>Tambah Kategori Baru</span>
            </button>
          )}

          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => setCurrentPage('pos')}
          >
            <ShoppingBag size={14} />
            <span>Buka Kasir POS</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}
      >
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'products' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} color={activeTab === 'products' ? 'var(--primary-light)' : 'var(--text-dim)'} />
          <span>Merchandise & Produk</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '999px',
              background: activeTab === 'products' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'products' ? 'var(--primary-light)' : 'var(--text-dim)',
            }}
          >
            {products.length}
          </span>
        </button>

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            color: activeTab === 'categories' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'categories' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onClick={() => setActiveTab('categories')}
        >
          <Layers size={16} color={activeTab === 'categories' ? 'var(--primary-light)' : 'var(--text-dim)'} />
          <span>Kategori Produk</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '999px',
              background: activeTab === 'categories' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'categories' ? 'var(--primary-light)' : 'var(--text-dim)',
            }}
          >
            {categories.filter(c => c.id !== 'all').length}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="page-scroll-content products-page-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {activeTab === 'products' ? (
          <>
            <ProductFilterBar
              filters={filters}
              categories={categories}
              onChange={setFilters}
              onReset={handleResetFilters}
              totalFiltered={filteredProducts.length}
              totalAll={products.length}
            />

            <ProductTable
              products={filteredProducts}
              categories={categories}
              onViewDetail={setSelectedProductDetail}
              onEdit={handleOpenEditProduct}
              onToggleStatus={handleToggleProductStatus}
              onAddNew={handleOpenAddProduct}
            />
          </>
        ) : (
          <CategoryList
            categories={categories}
            products={products}
            onAddNew={handleOpenAddCategory}
            onEdit={handleOpenEditCategory}
            onToggleStatus={handleToggleCategoryStatus}
            onDelete={handleDeleteCategory}
          />
        )}
      </div>

      {/* Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        initialProduct={editingProduct}
        categories={categories}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
      />

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        product={selectedProductDetail}
        categories={categories}
        onClose={() => setSelectedProductDetail(null)}
        onEdit={(p) => {
          setSelectedProductDetail(null);
          handleOpenEditProduct(p);
        }}
        onToggleStatus={handleToggleProductStatus}
      />

      {/* Category Form Modal (Add / Edit) */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        initialCategory={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
