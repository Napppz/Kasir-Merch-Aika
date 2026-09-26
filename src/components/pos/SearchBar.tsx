import React from 'react';
import { Search, ScanLine } from 'lucide-react';
import { usePos } from '../../context/PosContext';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, simulateScanProduct } = usePos();

  return (
    <div className="pos-search-bar">
      <div className="search-input-wrapper">
        <Search size={16} color="var(--text-muted)" />
        <input
          id="pos-search-input"
          type="text"
          className="search-input"
          placeholder="Cari nama produk atau scan barcode/SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="search-shortcuts">
          <span className="key-badge">Ctrl + K</span>
          <span className="key-badge">F2</span>
        </div>
      </div>

      <button
        type="button"
        className="scan-dummy-btn"
        onClick={simulateScanProduct}
        title="Simulasi scan barcode laser untuk merchandise"
      >
        <ScanLine size={15} />
        <span>Scan Dummy</span>
      </button>
    </div>
  );
};
