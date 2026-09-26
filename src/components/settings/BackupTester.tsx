import React from 'react';
import { TestTube, FileWarning, AlertOctagon, Sparkles } from 'lucide-react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_STOCK_MOVEMENTS, INITIAL_OPNAME_SESSIONS, INITIAL_BOOTH_SETTINGS } from '../../db/seedData';
import { APP_ID, APP_NAME, BACKUP_VERSION, CURRENT_DB_VERSION } from '../../services/backupService';
import type { BackupFile } from '../../types';

interface BackupTesterProps {
  onSelectFile: (file: File) => void;
}

export const BackupTester: React.FC<BackupTesterProps> = ({ onSelectFile }) => {
  // 1. Valid Full Backup
  const handleTestValidBackup = () => {
    const backup: BackupFile = {
      app: APP_ID,
      appName: APP_NAME,
      backupVersion: BACKUP_VERSION,
      databaseVersion: CURRENT_DB_VERSION,
      createdAt: new Date().toISOString(),
      exportedStores: ['products', 'categories', 'transactions', 'stock_movements', 'opname_sessions', 'settings'],
      recordCounts: {
        products: INITIAL_PRODUCTS.length,
        categories: INITIAL_CATEGORIES.length,
        transactions: INITIAL_TRANSACTIONS.length,
        stock_movements: INITIAL_STOCK_MOVEMENTS.length,
        opname_sessions: INITIAL_OPNAME_SESSIONS.length,
        settings: 2,
      },
      checksum: 'simulated-valid-sha256',
      data: {
        products: INITIAL_PRODUCTS,
        categories: INITIAL_CATEGORIES,
        transactions: INITIAL_TRANSACTIONS,
        stock_movements: INITIAL_STOCK_MOVEMENTS,
        opname_sessions: INITIAL_OPNAME_SESSIONS,
        settings: [
          { key: 'booth_config', value: INITIAL_BOOTH_SETTINGS },
          { key: 'is_initialized', value: true },
        ],
      },
    };

    const file = new File([JSON.stringify(backup, null, 2)], 'CosplayPOS-VerifiedBackup.json', {
      type: 'application/json',
    });
    onSelectFile(file);
  };

  // 2. Corrupt JSON
  const handleTestCorruptJson = () => {
    const file = new File(['{"app": "CosplayPOS", invalid_json_syntax...'], 'corrupt-backup.json', {
      type: 'application/json',
    });
    onSelectFile(file);
  };

  // 3. Wrong App Identifier
  const handleTestWrongApp = () => {
    const wrongAppBackup = {
      app: 'AnotherStorePOS',
      appName: 'Generic Retail System',
      backupVersion: 1,
      databaseVersion: 2,
      data: { products: [], categories: [], transactions: [] },
    };
    const file = new File([JSON.stringify(wrongAppBackup)], 'wrong-app-backup.json', {
      type: 'application/json',
    });
    onSelectFile(file);
  };

  // 4. Newer Database Version
  const handleTestNewerVersion = () => {
    const newerVersionBackup = {
      app: APP_ID,
      appName: APP_NAME,
      backupVersion: 1,
      databaseVersion: 99, // Incompatible future version
      data: {
        products: INITIAL_PRODUCTS,
        categories: INITIAL_CATEGORIES,
        transactions: INITIAL_TRANSACTIONS,
      },
    };
    const file = new File([JSON.stringify(newerVersionBackup)], 'newer-version-backup.json', {
      type: 'application/json',
    });
    onSelectFile(file);
  };

  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TestTube size={16} color="var(--cyan)" />
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Simulator Pengujian Validasi & Pemulihan (Testing Suite)
          </h4>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '4px' }}>
          Tahap 5 Verification
        </span>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
        Uji coba instan untuk memverifikasi proteksi penolakan berkas rusak, pengecekan kompatibilitas versi, dan pemulihan data cadangan terverifikasi secara offline.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
        {/* Test 1: Valid Backup */}
        <button
          id="btn-test-valid-restore"
          type="button"
          onClick={handleTestValidBackup}
          style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: 'var(--cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'left',
          }}
        >
          <Sparkles size={13} style={{ flexShrink: 0 }} />
          <span>Uji Restore Backup Valid</span>
        </button>

        {/* Test 2: Corrupt JSON */}
        <button
          id="btn-test-corrupt-json"
          type="button"
          onClick={handleTestCorruptJson}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'left',
          }}
        >
          <FileWarning size={13} style={{ flexShrink: 0 }} />
          <span>Uji Penolakan: JSON Rusak</span>
        </button>

        {/* Test 3: Wrong App */}
        <button
          id="btn-test-wrong-app"
          type="button"
          onClick={handleTestWrongApp}
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#f59e0b',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'left',
          }}
        >
          <AlertOctagon size={13} style={{ flexShrink: 0 }} />
          <span>Uji Penolakan: App Berbeda</span>
        </button>

        {/* Test 4: Newer DB Version */}
        <button
          id="btn-test-newer-version"
          type="button"
          onClick={handleTestNewerVersion}
          style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            color: '#c084fc',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'left',
          }}
        >
          <AlertOctagon size={13} style={{ flexShrink: 0 }} />
          <span>Uji Penolakan: Skema Baru (v99)</span>
        </button>
      </div>
    </div>
  );
};
