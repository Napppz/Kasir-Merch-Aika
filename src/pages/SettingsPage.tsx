import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Printer, Store, User, ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { backupService } from '../services/backupService';
import type { LastBackupInfo } from '../types';
import { DatabaseStatusCard } from '../components/settings/DatabaseStatusCard';
import { LastBackupCard } from '../components/settings/LastBackupCard';
import { BackupActionCard } from '../components/settings/BackupActionCard';
import { RestoreCard } from '../components/settings/RestoreCard';
import { DangerZone } from '../components/settings/DangerZone';
import { QuickCashConfigCard } from '../components/settings/QuickCashConfigCard';

export const SettingsPage: React.FC = () => {
  const { settings, refreshAllData, addToast } = usePos();

  // Database stats state
  const [dbStats, setDbStats] = useState<{
    status: 'Healthy' | 'Warning';
    version: number;
    counts: Record<string, number>;
    estimatedSizeBytes: number;
  }>({
    status: 'Healthy',
    version: 2,
    counts: {},
    estimatedSizeBytes: 0,
  });

  const [lastBackup, setLastBackup] = useState<LastBackupInfo | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load database statistics & last backup info
  const loadDatabaseData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [stats, backupInfo] = await Promise.all([
        backupService.getDatabaseStats(),
        backupService.getLastBackupInfo(),
      ]);
      setDbStats(stats);
      setLastBackup(backupInfo);
    } catch (err) {
      console.error('Failed to load database stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Handlers for backup, restore, and reset actions
  const handleBackupSuccess = () => {
    loadDatabaseData();
  };

  const handleRestoreSuccess = async () => {
    await refreshAllData();
    await loadDatabaseData();
  };

  const handleResetSuccess = async () => {
    await refreshAllData();
    await loadDatabaseData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="page-subheader">
        <div className="subheader-title-group">
          <h2>
            <Settings size={20} color="var(--primary-light)" />
            <span>Pengaturan Terminal Kasir & Booth</span>
          </h2>
          <div className="subheader-subtitle">
            Konfigurasi informasi event, printer thermal, dan sistem pencadangan database lokal
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION: BOOTH & HARDWARE */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
              Informasi Terminal & Perangkat Keras
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {/* Booth Info */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Store size={16} color="var(--primary-light)" />
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0 }}>Informasi Booth & Event</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Nama Toko:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{settings.boothName}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Event:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{settings.eventName}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Lokasi:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{settings.hallLocation}</div>
                  </div>
                </div>
              </div>

              {/* Printer & Hardware */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Printer size={16} color="var(--cyan)" />
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0 }}>Printer Thermal & Hardware</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Tipe Printer:</span>
                    <div style={{ fontWeight: 700, color: 'var(--cyan)' }}>{settings.printerName}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Lebar Kertas:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>80mm (ESC/POS Standard)</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Auto Eject Laci Kasir:</span>
                    <div style={{ fontWeight: 700, color: '#34d399' }}>Aktif (Kabel RJ11)</div>
                  </div>
                </div>
              </div>

              {/* Operator */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <User size={16} color="var(--pink)" />
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0 }}>Operator Kasir</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Kasir Bertugas:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{settings.cashierName} ({settings.cashierId})</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Terminal ID:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {settings.terminalId}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Mata Uang:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{settings.currency} (IDR)</div>
                  </div>
                </div>
              </div>

              {/* QRIS Statis & Pembayaran Digital */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '70px',
                    minWidth: '70px',
                    height: '100px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1.5px solid rgba(236, 72, 153, 0.4)',
                    background: '#ffffff',
                  }}
                >
                  <img
                    src={settings.qrisImageUrl || '/qris.png'}
                    alt="QRIS Aika Sesilia"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCode size={16} color="var(--pink)" />
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: 0 }}>QRIS Statis Standar Nasional</h3>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Merchant:</span>
                    <div style={{ fontWeight: 800, color: '#ffffff' }}>{settings.qrisMerchantName || 'AIKA SESILIA'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>NMID: </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {settings.qrisNmid || 'ID1025440784557'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Stand: </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {settings.qrisTerminalCode || 'A01'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '11px', marginTop: '2px' }}>
                    <CheckCircle2 size={12} />
                    <span>Offline Standar ASPI & BI Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: QUICK CASH NOMINALS CONFIGURATION */}
          <QuickCashConfigCard />

          {/* SECTION: DATA & BACKUP (BAGIAN 7) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={18} color="var(--primary-light)" />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                DATA & BACKUP
              </h2>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px' }}>
              Manajemen keamanan basis data offline event: pencadangan penuh, pemulihan darurat, dan integritas data.
            </div>

            {/* Top Row: Database Status & Last Backup */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <DatabaseStatusCard
                status={dbStats.status}
                version={dbStats.version}
                counts={dbStats.counts}
                estimatedSizeBytes={dbStats.estimatedSizeBytes}
                loading={loadingStats}
                onRefresh={loadDatabaseData}
              />

              <LastBackupCard lastBackup={lastBackup} />
            </div>

            {/* Action Row: Backup Sekarang & Restore Backup */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <BackupActionCard
                onBackupSuccess={handleBackupSuccess}
                onError={(msg) => addToast(msg, 'error')}
                onSuccessToast={(msg) => addToast(msg, 'success')}
              />

              <RestoreCard
                onRestoreSuccess={handleRestoreSuccess}
                onError={(msg) => addToast(msg, 'error')}
                onSuccessToast={(msg) => addToast(msg, 'success')}
              />
            </div>

            {/* Bottom: Danger Zone */}
            <DangerZone
              onResetSuccess={handleResetSuccess}
              onError={(msg) => addToast(msg, 'error')}
              onSuccessToast={(msg) => addToast(msg, 'success')}
            />
          </div>

        </div>
      </div>
    </div>
  );
};
