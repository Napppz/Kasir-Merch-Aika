import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle, Check } from 'lucide-react';
import type { Category } from '../../types';

interface CategoryFormModalProps {
  isOpen: boolean;
  initialCategory?: Category | null;
  onClose: () => void;
  onSubmit: (categoryData: Omit<Category, 'id'> | Category) => Promise<{ success: boolean; error?: string }>;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  initialCategory,
  onClose,
  onSubmit,
}) => {
  const isEditing = Boolean(initialCategory);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name);
        setDescription(initialCategory.description || '');
        setIsActive(initialCategory.isActive);
      } else {
        setName('');
        setDescription('');
        setIsActive(true);
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialCategory) {
        const result = await onSubmit({
          ...initialCategory,
          name: cleanName,
          description: description.trim(),
          isActive,
        });
        if (!result.success) {
          setErrorMessage(result.error || 'Gagal menyimpan perubahan kategori.');
        } else {
          onClose();
        }
      } else {
        const result = await onSubmit({
          name: cleanName,
          description: description.trim(),
          isActive,
        });
        if (!result.success) {
          setErrorMessage(result.error || 'Gagal membuat kategori baru.');
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
          width: '500px',
          background: '#0e1628',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-xl)',
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
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)',
              }}
            >
              <Layers size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                {isEditing ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {isEditing ? 'Ubah informasi kategori merchandise' : 'Tambahkan kategori baru untuk booth'}
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
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Nama Kategori <span style={{ color: 'var(--pink)' }}>* (Unik)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Acrylic Stand, Lightstick, Nendoroid"
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

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              placeholder="Keterangan jenis merchandise atau spesifikasi kategori..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: '#ffffff',
                resize: 'none',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Status Kategori Aktif</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                {isActive
                  ? 'Kategori aktif dan dapat dipilih saat membuat produk baru'
                  : 'Kategori dinonaktifkan dari pilihan produk baru'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              style={{
                width: '44px',
                height: '22px',
                borderRadius: '11px',
                background: isActive ? '#6366f1' : '#334155',
                position: 'relative',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: isActive ? '24px' : '3px',
                  transition: 'all var(--transition-fast)',
                }}
              />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
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
                padding: '9px 20px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 14px var(--primary-glow)',
                cursor: 'pointer',
              }}
            >
              <Check size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Kategori'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
