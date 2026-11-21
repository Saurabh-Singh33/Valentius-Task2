import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...', size = 32 }) {
  return (
    <div className="spinner-container" role="status" aria-live="polite">
      <Loader2 className="spinner-icon" size={size} />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
}
