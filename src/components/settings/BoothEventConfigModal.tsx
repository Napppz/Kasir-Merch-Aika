import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  Sparkles, 
  MapPin, 
  User, 
  FileText, 
  Check, 
  RotateCcw,
  Receipt,
  Tag
} from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface BoothEventConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_EVENT_PRESETS = [
  'Comifuro 19',
  'Comic Frontier',
  'Creator Super Fest',
  'AFA Indonesia',
  'Popcon Asia',
  'Anime Festival',
  'Bazar Kreatif Pop-up',
];

export const BoothEventConfigModal: React.FC<BoothEventConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, addToast } = usePos();

  const [eventName, setEventName] = useState(settings.eventName || '');
  const [hallLocation, setHallLocation] = useState(settings.hallLocation || '');
  const [boothName, setBoothName] = useState(settings.boothName || '');
  const [cashierName, setCashierName] = useState(settings.cashierName || '');
  const [cashierId, setCashierId] = useState(settings.cashierId || '');
  const [receiptNote, setReceiptNote] = useState(settings.receiptNote || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync form when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      setEventName(settings.eventName || '');
      setHallLocation(settings.hallLocation || '');
      setBoothName(settings.boothName || '');
      setCashierName(settings.cashierName || '');
      setCashierId(settings.cashierId || '');
      setReceiptNote(settings.receiptNote || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: string) => {
    setEventName(preset);
  };

  const handleClearEventName = () => {
    setEventName('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const success = await updateSettings({
        eventName: eventName.trim(),
        hallLocation: hallLocation.trim(),
        boothName: boothName.trim() || 'BOOTH KASIR',
        cashierName: cashierName.trim() || 'Kasir',
        cashierId: cashierId.trim() || 'Kasir 01',
        receiptNote: receiptNote.trim(),
      });

      if (success) {
        addToast(
          eventName.trim() 
            ? `Event aktif diatur ke "${eventName.trim()}"` 
            : 'Nama event berhasil dikosongkan.',
          'success'
        );
        onClose();
      }
    } catch (err) {
      console.error('Failed to update event & booth settings:', err);
      addToast('Gagal menyimpan pengaturan booth', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '580px',
          width: '95%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(236, 72, 153, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(168, 85, 247, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(236, 72, 153, 0.2)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pink)',
              }}
            >
              <Store size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Pengaturan Event & Terminal Booth</span>
                <Sparkles size={14} color="#f472b6" />
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Atur nama event baru, lokasi booth, dan informasi kasir yang tampil pada struk
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Field: NAMA EVENT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} color="var(--pink)" />
                  <span>Nama Event Saat Ini</span>
                </label>
                {eventName && (
                  <button
                    type="button"
                    onClick={handleClearEventName}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Contoh: Comifuro 19 / Creator Super Fest / Popcon..."
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1.5px solid var(--border-pink)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: '0 0 10px rgba(236, 72, 153, 0.15)',
                }}
                autoFocus
              />

              {/* Quick Event Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Pilihan Cepat / Preset Populer:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {POPULAR_EVENT_PRESETS.map((preset) => {
                    const isSelected = eventName.toLowerCase() === preset.toLowerCase();
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        style={{
                          background: isSelected ? 'var(--pink)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isSelected ? 'var(--pink)' : 'var(--border-subtle)'}`,
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Field: LOKASI BOOTH / HALL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--primary-light)" />
                <span>Lokasi Booth / Hall</span>
              </label>
              <input
                type="text"
                value={hallLocation}
                onChange={(e) => setHallLocation(e.target.value)}
                placeholder="Contoh: Booth AH-20 • ICE BSD Hall 8"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Row: NAMA TOKO & OPERATOR KASIR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Store size={14} color="#38bdf8" />
                  <span>Nama Toko / Booth</span>
                </label>
                <input
                  type="text"
                  value={boothName}
                  onChange={(e) => setBoothName(e.target.value)}
                  placeholder="AIKA SESILIA OFFICIAL BOOTH"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#f472b6" />
                  <span>Nama Kasir Bertugas</span>
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Aika Sesilia"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Field: PESAN STRUK FOOTER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="#a855f7" />
                <span>Catatan Kaki Struk (Receipt Footer Note)</span>
              </label>
              <input
                type="text"
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                placeholder="Contoh: Terima kasih telah berbelanja di booth Aika Sesilia!"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Live Preview Box */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={13} color="var(--primary-light)" />
                  <span>Pratinjau Struk & Header</span>
                </div>
                {eventName ? (
                  <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    🎪 {eventName}
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Tanpa Nama Event
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '8px',
                  borderRadius: '4px',
                  lineHeight: '1.4',
                }}
              >
                <div style={{ fontWeight: 800, color: '#ffffff' }}>{boothName || 'NAMA BOOTH'}</div>
                {eventName && <div style={{ color: '#38bdf8' }}>{eventName}</div>}
                {hallLocation && <div>{hallLocation}</div>}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'var(--bg-card-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, var(--pink), var(--primary))',
                border: 'none',
                color: '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '9px 20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)',
              }}
            >
              <Check size={14} />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
