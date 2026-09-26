import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  AlertCircle, 
  Check, 
  Sparkles,
  Tag
} from 'lucide-react';
import type { Product, Category } from '../../types';
import { calculateMargin, compressImageFile, generateDefaultMerchSvg } from '../../utils/productHelpers';
import { formatRupiah } from '../../utils/formatters';

interface ProductFormModalProps {
  isOpen: boolean;
  initialProduct?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product) => Promise<{ success: boolean; error?: string }>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  initialProduct,
  categories,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [minimumStock, setMinimumStock] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [image, setImage] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active categories eligible for new/edited products
  const activeCategories = categories.filter(c => c.id !== 'all' && (c.isActive || (initialProduct && c.id === initialProduct.categoryId)));

  // Populate form when opened
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setName(initialProduct.name);
        setSku(initialProduct.sku);
        setCategoryId(initialProduct.categoryId);
        setPrice(initialProduct.price);
        setCostPrice(initialProduct.costPrice);
        setStock(initialProduct.stock);
        setMinimumStock(initialProduct.minimumStock);
        setDescription(initialProduct.description || '');
        setLocationNote(initialProduct.locationNote || '');
        setImage(initialProduct.image || '');
        setIsActive(initialProduct.isActive);
      } else {
        // New Product defaults
        setName('');
        setSku('');
        setCategoryId(activeCategories[0]?.id || '');
        setPrice(0);
        setCostPrice(0);
        setStock(10);
        setMinimumStock(3);
        setDescription('');
        setLocationNote('');
        setImage('');
        setIsActive(true);
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  // Margin calculation
  const margin = calculateMargin(price, costPrice);

  // Handle image upload & compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageFile(file);
      setImage(compressedDataUrl);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage('Gagal memproses gambar. Gunakan format JPG atau PNG.');
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateDefaultImage = () => {
    const selectedCat = categories.find(c => c.id === categoryId)?.name || 'Merch';
    const defaultSvg = generateDefaultMerchSvg(name || 'COSPLAY', selectedCat);
    setImage(defaultSvg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Nama produk minimal 2 karakter.');
      return;
    }

    if (!sku.trim()) {
      setErrorMessage('SKU wajib diisi.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Wajib memilih kategori produk yang aktif.');
      return;
    }

    if (price < 0 || costPrice < 0) {
      setErrorMessage('Harga jual dan harga modal tidak boleh negatif.');
      return;
    }

    if (stock < 0 || minimumStock < 0) {
      setErrorMessage('Stok dan minimum stok tidak boleh negatif.');
      return;
    }

    // Auto-generate placeholder image if empty
    let finalImage = image;
    if (!finalImage) {
      const selectedCat = categories.find(c => c.id === categoryId)?.name || 'Merch';
      finalImage = generateDefaultMerchSvg(name, selectedCat);
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialProduct) {
        const result = await onSubmit({
          ...initialProduct,
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          categoryId,
          price,
          costPrice,
          stock,
          minimumStock,
          description: description.trim(),
          locationNote: locationNote.trim(),
          image: finalImage,
          isActive,
        });
        if (!result.success) {
          setErrorMessage(result.error || 'Gagal menyimpan perubahan.');
        } else {
          onClose();
        }
      } else {
        const result = await onSubmit({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          categoryId,
          price,
          costPrice,
          stock,
          minimumStock,
          description: description.trim(),
          locationNote: locationNote.trim(),
          image: finalImage,
          isActive,
        });
        if (!result.success) {
          setErrorMessage(result.error || 'Gagal menambahkan produk.');
        } else {
          onClose();
        }
      }
    } catch {
      setErrorMessage('Terjadi kesalahan pada sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="checkout-modal-card"
        style={{
          width: '760px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0e1628',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isEditing ? 'var(--cyan-bg)' : 'var(--primary-glow)',
                border: `1px solid ${isEditing ? 'var(--cyan)' : 'var(--primary)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isEditing ? 'var(--cyan)' : 'var(--primary-light)',
              }}
            >
              <Tag size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                {isEditing ? `Edit Produk: ${initialProduct?.sku}` : 'Tambah Produk Baru'}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {isEditing ? 'Perbarui informasi merchandise booth' : 'Daftarkan merchandise baru ke katalog kasir offline'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--text-dim)', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Error Alert Banner */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Top Section: Photo & Basic Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '20px' }}>
            {/* Image Preview & Upload Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                Foto Merchandise
              </label>

              <div
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: 'var(--radius-md)',
                  background: '#080d16',
                  border: '1px dashed var(--border-muted)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {image ? (
                  <img
                    src={image}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '10px' }}>
                    <ImageIcon size={30} style={{ margin: '0 auto 6px' }} />
                    <span style={{ fontSize: '10px', display: 'block' }}>Belum ada foto</span>
                  </div>
                )}
              </div>

              {/* Upload & Action Buttons */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleImageFileChange}
              />

              <div style={{ display: 'flex', gap: '6px', width: '140px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={12} />
                  <span>{image ? 'Ganti' : 'Upload'}</span>
                </button>

                {image && (
                  <button
                    type="button"
                    style={{
                      padding: '6px 8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#f87171',
                    }}
                    onClick={handleRemoveImage}
                    title="Hapus foto"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <button
                type="button"
                style={{
                  fontSize: '10px',
                  color: 'var(--cyan)',
                  background: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                onClick={handleGenerateDefaultImage}
              >
                Gunakan Thumbnail SVG Anime
              </button>
            </div>

            {/* Basic Info Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Product Name */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Nama Produk / Merchandise <span style={{ color: 'var(--pink)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Acrylic Stand Raiden Shogun 15cm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    color: '#ffffff',
                  }}
                />
              </div>

              {/* SKU & Category Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Kode SKU <span style={{ color: 'var(--pink)' }}>* (Unik)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: ACR-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--cyan)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Kategori <span style={{ color: 'var(--pink)' }}>*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                  >
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Deskripsi / Seri Anime
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Genshin Impact Series Holo Base"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

          {/* Pricing & Margins Grid */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '10px' }}>
              HARGA & PROFIT MARGIN
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Harga Jual (Rp) <span style={{ color: 'var(--pink)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: '#ffffff',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Harga Modal / HPP (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                  }}
                />
              </div>

              {/* Real-time Margin Display Card */}
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--cyan)', fontWeight: 800 }}>
                  <Sparkles size={12} />
                  <span>ESTIMASI MARGIN LABA</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  {formatRupiah(margin.nominal, true, false)}{' '}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ({margin.percentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

          {/* Stock & Storage Location */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '10px' }}>
              STOK & LOKASI PENYIMPANAN
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Stok Awal <span style={{ color: 'var(--pink)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Minimum Stok Alert
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    color: '#ffffff',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Catatan Lokasi Simpan di Booth
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kardus Box #02 / Tas Ransel Kru A"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: '#ffffff',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Product Status Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Status Produk Aktif</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {isActive
                  ? 'Produk aktif dan dapat dipilih di terminal kasir POS'
                  : 'Produk nonaktif dan disembunyikan dari terminal kasir POS'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              style={{
                width: '46px',
                height: '24px',
                borderRadius: '12px',
                background: isActive ? '#6366f1' : '#334155',
                position: 'relative',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: isActive ? '25px' : '3px',
                  transition: 'all var(--transition-fast)',
                }}
              />
            </button>
          </div>

          {/* Modal Actions Footer */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 14px var(--primary-glow)',
                cursor: 'pointer',
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
