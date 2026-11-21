import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="page-container not-found-container">
      <div className="empty-state-card not-found-card">
        <div className="empty-state-icon">
          <AlertCircle size={56} className="text-muted" />
        </div>
        <h1 className="not-found-code">404</h1>
        <h2>Page Not Found</h2>
        <p>
          The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        <Link to="/" className="btn btn-primary">
          <Home size={18} />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
