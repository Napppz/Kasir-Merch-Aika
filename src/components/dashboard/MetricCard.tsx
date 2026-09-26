import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor: 'purple' | 'pink' | 'cyan' | 'red';
  footer: React.ReactNode;
  isWarning?: boolean;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  footer,
  isWarning,
  badge,
}) => {
  return (
    <div className={`metric-card ${isWarning ? 'warning-border' : ''}`}>
      <div className="metric-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="metric-title">{title}</span>
          {badge && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                background: '#f43f5e',
                color: 'white',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className={`metric-icon-box ${iconColor}`}>{icon}</div>
      </div>

      <div className="metric-val">{value}</div>

      <div className="metric-footer">{footer}</div>
    </div>
  );
};
