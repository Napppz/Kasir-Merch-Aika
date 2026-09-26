import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, AlertCircle, Loader2, FileJson } from 'lucide-react';
import { backupService } from '../../services/backupService';
import type { BackupFile } from '../../types';
import { RestoreModal } from './RestoreModal';
import { BackupTester } from './BackupTester';

interface RestoreCardProps {
  onRestoreSuccess: () => void;
  onError: (msg: string) => void;
  onSuccessToast: (msg: string) => void;
}

export const RestoreCard: React.FC<RestoreCardProps> = ({
  onRestoreSuccess,
  onError,
  onSuccessToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    setInspectionError(null);
    setIsInspecting(true);

    try {
      const result = await backupService.inspectBackup(file);
      if (!result.valid || !result.backup) {
        setInspectionError(result.error || 'File backup tidak valid atau rusak.');
        onError(result.error || 'File backup tidak valid atau rusak.');
        return;
      }

      setSelectedBackup(result.backup);
      setFileSizeBytes(result.fileSizeBytes);
      setIsModalOpen(true);
    } catch (err: any) {
      const msg = err?.message || 'Gagal memproses berkas.';
      setInspectionError(msg);
      onError(msg);
    } finally {
      setIsInspecting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  return (
    <>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileUp size={20} color="var(--cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Pemulihan Database (Restore Backup)
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Pulihkan data kasir dari berkas cadangan .json
            </span>
          </div>
        </div>

        {/* Drag & Drop Area (Bagian 19) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--cyan)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '24px 16px',
            textAlign: 'center',
            background: isDragging ? 'rgba(6, 182, 212, 0.08)' : 'rgba(0, 0, 0, 0.25)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <input
            id="input-backup-file"
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDragging ? 'var(--cyan)' : 'var(--text-secondary)',
            }}
          >
            {isInspecting ? (
              <Loader2 size={24} className="spinning" />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              {isInspecting ? 'Menganalisis Berkas Cadangan...' : 'Tarik & Lepaskan Berkas Backup (.json) ke Sini'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              atau klik area ini untuk memilih file dari komputer
            </span>
          </div>

          <button
            id="btn-choose-backup-file"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isInspecting}
            style={{
              marginTop: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileJson size={14} color="var(--cyan)" />
            <span>Pilih Berkas (.json)</span>
          </button>
        </div>

        {/* Inline Inspection Error Banner */}
        {inspectionError && (
          <div
            id="restore-error-banner"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '12px',
              color: '#f87171',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Berkas Tidak Valid:</strong>
              <span>{inspectionError}</span>
            </div>
          </div>
        )}

        {/* Testing & Verification Suite */}
        <BackupTester onSelectFile={processFile} />
      </div>

      {/* Confirmation & Preview Modal */}
      <RestoreModal
        isOpen={isModalOpen}
        backupFile={selectedBackup}
        fileSizeBytes={fileSizeBytes}
        onClose={() => setIsModalOpen(false)}
        onRestoreSuccess={(msg) => {
          onSuccessToast(msg);
          onRestoreSuccess();
        }}
        onError={onError}
      />
    </>
  );
};
