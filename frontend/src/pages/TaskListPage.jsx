import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ConfirmModal from '../components/ConfirmModal';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Eye,
  Edit2,
  Trash2,
  ClipboardList,
  AlertCircle,
  Filter,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function TaskListPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  // Modal state for deletion
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggling loading indicator per task
  const [togglingId, setTogglingId] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksAPI.getAll();
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Toggle completion status
  const handleToggleCompleted = async (task) => {
    const nextCompleted = !task.completed;
    setTogglingId(task.id);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      const updated = await tasksAPI.patch(task.id, { completed: nextCompleted });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      setError(`Failed to update "${task.title}": ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete task confirmation
  const confirmDelete = (task) => {
    setTaskToDelete(task);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setDeleteLoading(true);
    try {
      await tasksAPI.delete(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      setError(`Failed to delete "${taskToDelete.title}": ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter & search
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (statusFilter === 'completed') return matchesSearch && task.completed;
      if (statusFilter === 'pending') return matchesSearch && !task.completed;
      return matchesSearch;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Dashboard</h1>
          <p className="page-subtitle">Manage, organize, and track your daily work.</p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary">
          <Plus size={18} />
          <span>New Task</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap stat-total">
            <ClipboardList size={22} />
          </div>
          <div>
            <div className="stat-value">{totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-completed">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="stat-value">{completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-pending">
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{pendingTasks}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-rate">
            <span className="stat-percent-text">{completionPercentage}%</span>
          </div>
          <div className="stat-progress-section">
            <div className="stat-label">Completion Rate</div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && <ErrorAlert message={error} onRetry={fetchTasks} />}

      {/* Filters and search toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by title or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({totalTasks})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({pendingTasks})
          </button>
          <button
            type="button"
            className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({completedTasks})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="empty-state-card">
          <LoadingSpinner text="Fetching your tasks from API..." />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <ClipboardList size={48} />
          </div>
          <h3>No tasks found</h3>
          <p>
            {searchQuery || statusFilter !== 'all'
              ? 'No tasks matched your current search or filter criteria.'
              : 'You have not created any tasks yet. Get started by adding one!'}
          </p>
          {searchQuery || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          ) : (
            <Link to="/tasks/new" className="btn btn-primary">
              <Plus size={18} />
              <span>Create First Task</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`task-card ${task.completed ? 'completed' : ''}`}
            >
              <div className="task-card-main">
                {/* Checkbox toggle */}
                <button
                  type="button"
                  className="task-checkbox-btn"
                  onClick={() => handleToggleCompleted(task)}
                  disabled={togglingId === task.id}
                  title={task.completed ? 'Mark pending' : 'Mark completed'}
                  aria-label={task.completed ? 'Mark pending' : 'Mark completed'}
                >
                  {task.completed ? (
                    <CheckCircle2 size={24} className="checkbox-icon checked" />
                  ) : (
                    <Circle size={24} className="checkbox-icon unchecked" />
                  )}
                </button>

                {/* Task content */}
                <div className="task-card-info">
                  <div className="task-title-row">
                    <Link to={`/tasks/${task.id}`} className="task-title-link">
                      <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                        {task.title}
                      </span>
                    </Link>
                    <span
                      className={`badge ${task.completed ? 'badge-success' : 'badge-warning'}`}
                    >
                      {task.completed ? 'Done' : 'Pending'}
                    </span>
                  </div>

                  {task.description && (
                    <p className="task-description-snippet">
                      {task.description.length > 120
                        ? `${task.description.slice(0, 120)}...`
                        : task.description}
                    </p>
                  )}

                  <div className="task-metadata">
                    <span>
                      Created: {new Date(task.createdAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="task-card-actions">
                <Link
                  to={`/tasks/${task.id}`}
                  className="btn-icon"
                  title="View Details"
                  aria-label="View Details"
                >
                  <Eye size={18} />
                </Link>
                <Link
                  to={`/tasks/${task.id}/edit`}
                  className="btn-icon"
                  title="Edit Task"
                  aria-label="Edit Task"
                >
                  <Edit2 size={18} />
                </Link>
                <button
                  type="button"
                  onClick={() => confirmDelete(task)}
                  className="btn-icon btn-icon-danger"
                  title="Delete Task"
                  aria-label="Delete Task"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
