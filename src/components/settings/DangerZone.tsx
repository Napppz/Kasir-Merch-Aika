import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, Download, X, Loader2 } from 'lucide-react';
import { backupService } from '../../services/backupService';

interface DangerZoneProps {
  onResetSuccess: () => void;
  onError: (msg: string) => void;
  onSuccessToast: (msg: string) => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  onResetSuccess,
  onError,
  onSuccessToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const REQUIRED_CONFIRM_TEXT = 'HAPUS SEMUA DATA';

  const openResetModal = () => {
    setStep(1);
    setConfirmText('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isProcessing) return;
    setIsModalOpen(false);
    setStep(1);
    setConfirmText('');
  };

  const handleBackupAndProceed = async () => {
    setIsProcessing(true);
    try {
      const backup = await backupService.createBackup();
      await backupService.downloadBackup(backup, 'Backup');
      onSuccessToast('File cadangan pengaman berhasil diunduh.');
      setStep(2);
    } catch (err: any) {
      onError('Gagal mengunduh backup sebelum reset: ' + err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedWithoutBackup = () => {
    setStep(2);
  };

  const handleExecuteReset = async () => {
    if (confirmText.trim() !== REQUIRED_CONFIRM_TEXT || isProcessing) return;
    setIsProcessing(true);

    try {
      await backupService.resetDatabase();
      onSuccessToast('Database berhasil direset. Seluruh data telah dibersihkan.');
      onResetSuccess();
      closeModal();
    } catch (err: any) {
      onError('Gagal mereset database: ' + err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        style={{
          marginTop: '8px',
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} color="#f87171" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f87171', margin: 0 }}>
                Zona Berbahaya (Danger Zone)
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Tindakan penghapusan database permanen
              </span>
            </div>
          </div>

          <button
            id="btn-reset-db"
            onClick={openResetModal}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Trash2 size={14} />
            <span>Reset Semua Data</span>
          </button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Mereset database lokal akan mengosongkan seluruh data produk, riwayat nota transaksi kasir, log mutasi stok, dan sesi stock opname. Tindakan ini tidak dapat dibatalkan kecuali Anda memiliki file cadangan.
        </p>
      </div>

      {/* 2-Step Confirmation Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
              width: '95%',
              background: 'var(--bg-card)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(239, 68, 68, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#f87171" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f87171', margin: 0 }}>
                  {step === 1 ? 'Konfirmasi 1: Pengamanan Data' : 'Konfirmasi 2: Verifikasi Hapus Permanen'}
                </h3>
              </div>
              <button
                id="btn-reset-cancel-x"
                onClick={closeModal}
                disabled={isProcessing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {step === 1 ? (
                <>
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#ffffff',
                    }}
                  >
                    <strong style={{ color: '#f87171', display: 'block', marginBottom: '6px' }}>
                      Semua produk, transaksi, stok, kategori, dan histori akan dihapus.
                    </strong>
                    Database lokal pada peramban ini akan dikosongkan seluruhnya seperti kondisi terminal baru.
                  </div>

                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyan)' }}>
                      Backup data sebelum menghapus?
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Kami sangat menyarankan untuk mengunduh salinan cadangan terlebih dahulu agar Anda dapat memulihkannya jika sewaktu-waktu dibutuhkan.
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      <button
                        id="btn-reset-backup-continue"
                        onClick={handleBackupAndProceed}
                        disabled={isProcessing}
                        style={{
                          background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="spinning" />
                            <span>Mengunduh Cadangan...</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <span>Backup & Lanjutkan</span>
                          </>
                        )}
                      </button>

                      <button
                        id="btn-reset-skip-backup"
                        onClick={handleProceedWithoutBackup}
                        disabled={isProcessing}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Lanjutkan Tanpa Backup
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Untuk melanjutkan penghapusan database lokal secara permanen, silakan ketik teks di bawah ini dengan tepat:
                    </span>
                    <div
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#f87171',
                        letterSpacing: '1px',
                        textAlign: 'center',
                        userSelect: 'all',
                      }}
                    >
                      {REQUIRED_CONFIRM_TEXT}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                      Ketik teks konfirmasi di sini:
                    </label>
                    <input
                      id="input-reset-confirm"
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Ketik HAPUS SEMUA DATA"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'var(--bg-surface)',
                        border: `1px solid ${confirmText === REQUIRED_CONFIRM_TEXT ? '#f87171' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      autoFocus
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 20px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
              }}
            >
              <button
                id="btn-reset-cancel-1"
                onClick={closeModal}
                disabled={isProcessing}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                Batal
              </button>

              {step === 2 && (
                <button
                  id="btn-reset-confirm-final"
                  onClick={handleExecuteReset}
                  disabled={confirmText.trim() !== REQUIRED_CONFIRM_TEXT || isProcessing}
                  style={{
                    background:
                      confirmText.trim() === REQUIRED_CONFIRM_TEXT && !isProcessing
                        ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color: confirmText.trim() === REQUIRED_CONFIRM_TEXT && !isProcessing ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: confirmText.trim() === REQUIRED_CONFIRM_TEXT && !isProcessing ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow:
                      confirmText.trim() === REQUIRED_CONFIRM_TEXT ? '0 4px 15px rgba(239, 68, 68, 0.4)' : 'none',
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={15} className="spinning" />
                      <span>Mereset Data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Hapus Permanen Semua Data</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
