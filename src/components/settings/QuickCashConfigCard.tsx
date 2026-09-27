import React, { useState, useEffect } from 'react';
import { Banknote, Plus, Trash2, RotateCcw, Check, Sparkles } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { formatRupiah } from '../../utils/formatters';

const DEFAULT_DENOMINATIONS = [10000, 20000, 50000, 100000];
const SUGGESTED_PRESETS = [10000, 20000, 25000, 50000, 75000, 100000, 150000, 200000];

export const QuickCashConfigCard: React.FC = () => {
  const { settings, updateSettings, addToast } = usePos();
  const [denominations, setDenominations] = useState<number[]>(
    settings.quickCashAmounts && settings.quickCashAmounts.length > 0
      ? settings.quickCashAmounts
      : DEFAULT_DENOMINATIONS
  );
  const [customInput, setCustomInput] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    if (settings.quickCashAmounts && settings.quickCashAmounts.length > 0) {
      setDenominations(settings.quickCashAmounts);
    }
  }, [settings.quickCashAmounts]);

  const handleAddDenomination = (amount: number) => {
    if (amount <= 0) {
      addToast('Nominal harus lebih besar dari 0', 'error');
      return;
    }
    if (denominations.includes(amount)) {
      addToast(`Nominal ${formatRupiah(amount, true, false)} sudah ada dalam daftar`, 'info');
      return;
    }
    const updated = [...denominations, amount].sort((a, b) => a - b);
    setDenominations(updated);
    setHasChanges(true);
    setCustomInput('');
  };

  const handleRemoveDenomination = (amount: number) => {
    if (denominations.length <= 1) {
      addToast('Minimal harus ada 1 nominal Quick Cash', 'error');
      return;
    }
    const updated = denominations.filter((d) => d !== amount);
    setDenominations(updated);
    setHasChanges(true);
  };

  const handleResetDefault = () => {
    setDenominations(DEFAULT_DENOMINATIONS);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSettings({ quickCashAmounts: denominations });
      if (success) {
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

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
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Banknote size={20} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Kustomisasi Nominal Quick Cash</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: 'rgba(236, 72, 153, 0.2)',
                  color: 'var(--pink)',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                POS Kasir
              </span>
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Atur tombol pecahan uang tunai cepat yang muncul di panel POS dan modal checkout saat pembeli membayar tunai
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleResetDefault}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Kembalikan ke nominal standar (10k, 20k, 50k, 100k)"
          >
            <RotateCcw size={12} />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Active Denominations List */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Nominal Aktif ({denominations.length} Tombol)</span>
          <span style={{ color: 'var(--text-dim)', textTransform: 'none', fontWeight: 500 }}>
            Klik silang (✕) untuk menghapus
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {denominations.map((amt) => (
            <div
              key={amt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span>{formatRupiah(amt, true, false)}</span>
              <button
                type="button"
                onClick={() => handleRemoveDenomination(amt)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(244, 63, 94, 0.8)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '3px',
                }}
                title={`Hapus ${formatRupiah(amt, true, false)}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add Presets & Custom Input */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>
          Pilihan Cepat Tambah Nominal:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SUGGESTED_PRESETS.map((preset) => {
            const isAdded = denominations.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                disabled={isAdded}
                onClick={() => handleAddDenomination(preset)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  background: isAdded ? 'rgba(255, 255, 255, 0.03)' : 'rgba(236, 72, 153, 0.1)',
                  border: isAdded ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '4px',
                  color: isAdded ? 'var(--text-dim)' : 'var(--pink)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isAdded ? 'not-allowed' : 'pointer',
                  opacity: isAdded ? 0.4 : 1,
                }}
              >
                {!isAdded && <Plus size={11} />}
                <span>{formatRupiah(preset, true, false)}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '240px' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              Rp
            </span>
            <input
              type="number"
              placeholder="Nominal manual..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = parseInt(customInput, 10);
                  if (!isNaN(val)) handleAddDenomination(val);
                }
              }}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const val = parseInt(customInput, 10);
              if (!isNaN(val)) handleAddDenomination(val);
            }}
            disabled={!customInput || isNaN(parseInt(customInput, 10))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: (!customInput || isNaN(parseInt(customInput, 10))) ? 'not-allowed' : 'pointer',
              opacity: (!customInput || isNaN(parseInt(customInput, 10))) ? 0.5 : 1,
            }}
          >
            <Plus size={13} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--cyan)', fontWeight: 700, marginBottom: '8px' }}>
          <Sparkles size={13} />
          <span>Pratinjau Tombol di Panel Kasir POS:</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <div
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            Uang Pas (Auto)
          </div>
          {denominations.map((amt) => (
            <div
              key={amt}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {formatRupiah(amt, true, false)}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            background: hasChanges ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
            border: hasChanges ? '1px solid var(--primary-light)' : '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-md)',
            color: hasChanges ? '#ffffff' : 'var(--text-dim)',
            fontSize: '13px',
            fontWeight: 800,
            cursor: hasChanges ? 'pointer' : 'default',
            boxShadow: hasChanges ? '0 0 14px var(--primary-glow)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Check size={16} />
          <span>{saving ? 'Menyimpan...' : hasChanges ? 'Simpan Perubahan Quick Cash' : 'Tersimpan'}</span>
        </button>
      </div>
    </div>
  );
};
