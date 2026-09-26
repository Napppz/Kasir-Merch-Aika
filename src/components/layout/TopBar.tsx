import React from 'react';
import { Clock, WifiOff, HardDrive, Menu } from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface TopBarProps {
  onToggleMobileSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleMobileSidebar }) => {
  const { currentTimeString, settings } = usePos();

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
        <div className="offline-pill">
          <HardDrive size={13} />
          <span className="pill-text-desktop">Mode Offline - Data tersimpan di perangkat</span>
          <span className="pill-text-mobile">Offline</span>
        </div>
        <div className="event-pill">
          <span>🎪</span>
          <span>{settings.eventName}</span>
        </div>
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
