import React from 'react';
import './DetailModal.css';

export interface Field {
  label: string;
  value: any;
  type?: 'text' | 'date' | 'json' | 'badge' | 'audio';
  render?: (value: any) => React.ReactNode;
}

export interface DetailModalProps {
  title: string;
  fields: Field[];
  isOpen: boolean;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  title,
  fields,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatValue = (field: Field): React.ReactNode => {
    // Use custom render function if provided
    if (field.render) {
      return field.render(field.value);
    }

    // Handle null/undefined values
    if (field.value === null || field.value === undefined) {
      return <span className="empty-value">—</span>;
    }

    // Format based on type
    switch (field.type) {
      case 'date':
        return formatDate(field.value);

      case 'json':
        return formatJSON(field.value);

      case 'badge':
        return formatBadge(field.value);

      case 'audio':
        return formatAudio(field.value);

      case 'text':
      default:
        return String(field.value);
    }
  };

  const formatDate = (value: any): string => {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return String(value);
      }
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(value);
    }
  };

  const formatJSON = (value: any): React.ReactNode => {
    try {
      const jsonString =
        typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      return (
        <pre className="json-display">
          <code>{jsonString}</code>
        </pre>
      );
    } catch {
      return String(value);
    }
  };

  const formatBadge = (value: any): React.ReactNode => {
    const badgeValue = String(value).toLowerCase();
    let badgeClass = 'badge';

    // Determine badge color based on value
    if (
      badgeValue === 'completed' ||
      badgeValue === 'success' ||
      badgeValue === 'active' ||
      badgeValue === 'synced' ||
      badgeValue === 'true'
    ) {
      badgeClass += ' badge-success';
    } else if (
      badgeValue === 'pending' ||
      badgeValue === 'incomplete' ||
      badgeValue === 'warning'
    ) {
      badgeClass += ' badge-warning';
    } else if (
      badgeValue === 'failed' ||
      badgeValue === 'error' ||
      badgeValue === 'inactive' ||
      badgeValue === 'false'
    ) {
      badgeClass += ' badge-error';
    } else {
      badgeClass += ' badge-default';
    }

    return <span className={badgeClass}>{String(value)}</span>;
  };

  const formatAudio = (value: any): React.ReactNode => {
    if (!value) {
      return <span className="empty-value">No audio</span>;
    }

    // If value is a URL or path
    if (typeof value === 'string') {
      return (
        <audio controls className="audio-player">
          <source src={value} type="audio/mpeg" />
          <source src={value} type="audio/m4a" />
          Your browser does not support the audio element.
        </audio>
      );
    }

    return String(value);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="field-list">
            {fields.map((field, index) => (
              <div key={index} className="field-item">
                <div className="field-label">{field.label}</div>
                <div className="field-value">{formatValue(field)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="modal-button modal-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
