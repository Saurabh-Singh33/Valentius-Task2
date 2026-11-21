import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  ListTodo,
  PlusCircle,
  LogOut,
  User,
  Menu,
  X,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobile}>
          <div className="brand-icon-wrapper">
            <CheckSquare size={22} className="brand-icon" />
          </div>
          <span className="brand-text">TaskMaster</span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Nav Links */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              <div className="nav-links">
                <NavLink
                  to="/tasks"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <ListTodo size={18} />
                  <span>Tasks</span>
                </NavLink>

                <NavLink
                  to="/tasks/new"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <PlusCircle size={18} />
                  <span>Create Task</span>
                </NavLink>
              </div>

              <div className="nav-auth-section">
                <div className="user-badge" title={user?.email}>
                  <User size={15} />
                  <span className="user-email">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-ghost-danger"
                  title="Log out"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="nav-links nav-auth-guest">
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <LogIn size={18} />
                <span>Log In</span>
              </NavLink>

              <NavLink
                to="/register"
                className="btn btn-sm btn-primary"
                onClick={closeMobile}
              >
                <UserPlus size={16} />
                <span>Register</span>
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
