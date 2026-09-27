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
        <div className="metric-title-group">
          <span className="metric-title">{title}</span>
          {badge && (
            <span className="metric-badge-status">
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
