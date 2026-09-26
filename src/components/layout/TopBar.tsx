import React from 'react';
import { Clock, WifiOff, HardDrive } from 'lucide-react';
import { usePos } from '../../context/PosContext';

export const TopBar: React.FC = () => {
  const { currentTimeString, settings } = usePos();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="offline-pill">
          <HardDrive size={13} />
          <span>Mode Offline - Data tersimpan di perangkat</span>
        </div>
        <div className="event-pill">
          <span>🎪</span>
          <span>{settings.eventName} • {settings.hallLocation.split('•')[0].trim()}</span>
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
