import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-content">
        <AlertCircle className="error-alert-icon" size={20} />
        <span className="error-alert-message">{message}</span>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-sm btn-outline-danger">
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
