import React from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Layers, Package, ShoppingBag, ArrowLeftRight, ClipboardCheck } from 'lucide-react';
import { formatBytes } from '../../services/backupService';

interface DatabaseStatusCardProps {
  status: 'Healthy' | 'Warning';
  version: number;
  counts: Record<string, number>;
  estimatedSizeBytes: number;
  loading?: boolean;
  onRefresh: () => void;
}

export const DatabaseStatusCard: React.FC<DatabaseStatusCardProps> = ({
  status,
  version,
  counts,
  estimatedSizeBytes,
  loading = false,
  onRefresh,
}) => {
  const isHealthy = status === 'Healthy';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <Database size={20} color="var(--cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Status Database Lokal
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Browser IndexedDB (Offline Storage)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              background: isHealthy ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isHealthy ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: isHealthy ? '#34d399' : '#f87171',
            }}
          >
            {isHealthy ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            <span>{isHealthy ? 'Healthy (Optimal)' : 'Warning'}</span>
          </div>

          {/* Refresh Button */}
          <button
            id="btn-refresh-db-stats"
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Perbarui Statistik Database"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Database Meta Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Versi Skema</span>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--cyan)' }}>
            v{version} (Offline Schema)
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Estimasi Ukuran</span>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
            {formatBytes(estimatedSizeBytes)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Koneksi Jaringan</span>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
            100% Offline
          </div>
        </div>
      </div>

      {/* Stores Breakdown */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Jumlah Record per Object Store
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={15} color="var(--pink)" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Produk</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{counts.products ?? 0} item</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} color="var(--purple)" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Kategori</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{counts.categories ?? 0} grup</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={15} color="#34d399" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Transaksi</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{counts.transactions ?? 0} nota</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftRight size={15} color="var(--cyan)" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Mutasi Stok</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{counts.stock_movements ?? 0} log</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={15} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Sesi Opname</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{counts.opname_sessions ?? 0} sesi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
