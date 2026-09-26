import React, { useState, useEffect } from 'react';
import { X, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Supplier } from '../../types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> | Supplier) => Promise<{ success: boolean; error?: string }>;
  supplierToEdit?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supplierToEdit,
}) => {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setContactPerson(supplierToEdit.contactPerson || '');
      setPhone(supplierToEdit.phone || '');
      setEmail(supplierToEdit.email || '');
      setAddress(supplierToEdit.address || '');
      setNotes(supplierToEdit.notes || '');
      setStatus(supplierToEdit.status);
    } else {
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setStatus('ACTIVE');
    }
    setErrorMessage('');
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Nama supplier wajib diisi (minimal 2 karakter).');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage('Format alamat email tidak valid.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let res;
      if (supplierToEdit) {
        res = await onSave({
          ...supplierToEdit,
          name: name.trim(),
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          status,
        });
      } else {
        res = await onSave({
          name: name.trim(),
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          status,
        });
      }

      if (res.success) {
        onClose();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', width: '92vw' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {supplierToEdit ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>
                Kelola data mitra merchandise dan supplier untuk Purchase Order
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              margin: '12px 20px 0 20px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Nama Supplier */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Nama Supplier / Vendor <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Akihabara Cosplay Props Co."
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Contact Person (PIC)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="Nama PIC"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Nomor Telepon / WhatsApp
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vendor@cosplayprop.jp"
              />
            </div>

            {/* Alamat */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Alamat / Lokasi Gudang
              </label>
              <textarea
                className="input-field"
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Alamat kantor atau lokasi pick up barang..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Catatan */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Catatan Tambahan
              </label>
              <input
                type="text"
                className="input-field"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Waktu pengerjaan PO 3-5 hari, minimal order, dsb."
              />
            </div>

            {/* Status (ACTIVE / INACTIVE) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Status Kemitraan
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStatus('ACTIVE')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: status === 'ACTIVE' ? '1px solid #10b981' : '1px solid var(--border-muted)',
                    background: status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                    color: status === 'ACTIVE' ? '#34d399' : 'var(--text-dim)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>AKTIF (Dapat Dipilih di PO)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('INACTIVE')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: status === 'INACTIVE' ? '1px solid #f43f5e' : '1px solid var(--border-muted)',
                    background: status === 'INACTIVE' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-surface)',
                    color: status === 'INACTIVE' ? '#fb7185' : 'var(--text-dim)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>NON-AKTIF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '120px' }}
            >
              {isSubmitting ? 'Menyimpan...' : supplierToEdit ? 'Simpan Perubahan' : 'Tambah Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
