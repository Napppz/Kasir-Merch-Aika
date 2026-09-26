import React from 'react';
import { Printer, ScanLine } from 'lucide-react';

export const BottomBar: React.FC = () => {
  return (
    <footer className="bottombar">
      <div className="shortcuts-guide">
        <div className="shortcut-chip">
          <span className="key-badge">Ctrl+K</span>
          <span>Cari</span>
        </div>
        <div className="shortcut-chip">
          <span className="key-badge">F2</span>
          <span>Scan Dummy</span>
        </div>
        <div className="shortcut-chip">
          <span className="key-badge">F4</span>
          <span>Keranjang</span>
        </div>
        <div className="shortcut-chip">
          <span className="key-badge pink">F9</span>
          <span style={{ color: '#f472b6', fontWeight: 600 }}>Bayar</span>
        </div>
        <div className="shortcut-chip">
          <span className="key-badge">Esc</span>
          <span>Tutup / Batal</span>
        </div>
      </div>

      <div className="hardware-status">
        <div className="hw-item">
          <Printer size={13} />
          <span>Thermal Printer: Siap</span>
        </div>
        <div className="hw-item">
          <ScanLine size={13} />
          <span>Scanner: Siap</span>
        </div>
      </div>
    </footer>
  );
};
