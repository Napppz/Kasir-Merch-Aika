import React from 'react';
import { Clock, WifiOff, Menu, Pencil } from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface TopBarProps {
  onToggleMobileSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleMobileSidebar }) => {
  const { currentTimeString, settings, openBoothModal } = usePos();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleMobileSidebar && (
          <button 
            type="button" 
            className="mobile-menu-btn" 
            onClick={onToggleMobileSidebar}
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="offline-pill" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#34d399' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
          <span className="pill-text-desktop" style={{ fontWeight: 700 }}>Offline Siap • Data Tersimpan Aman</span>
          <span className="pill-text-mobile" style={{ fontWeight: 700 }}>Offline Siap</span>
        </div>
        <button
          type="button"
          className={`event-pill event-pill--clickable ${!settings.eventName ? 'event-pill--empty' : ''}`}
          onClick={openBoothModal}
          title={settings.eventName ? `Event: ${settings.eventName} (Klik untuk ubah)` : 'Klik untuk menentukan nama event baru'}
        >
          <span>🎪</span>
          <span>{settings.eventName || '+ Tentukan Event'}</span>
          <Pencil size={10} className="event-pill-icon" />
        </button>
      </div>

      <div className="topbar-right">
        <div className="clock-display">
          <Clock size={14} />
          <span>{currentTimeString}</span>
        </div>

        <div className="connection-badge">
          <WifiOff size={12} />
          <span>Lokal</span>
        </div>

        <div className="topbar-avatar" title={`Operator: ${settings.cashierName}`}>
          <span>👤</span>
        </div>
      </div>
    </header>
  );
};
