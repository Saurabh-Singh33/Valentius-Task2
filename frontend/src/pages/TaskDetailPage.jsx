import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ConfirmModal from '../components/ConfirmModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  CheckSquare
} from 'lucide-react';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status toggle loading
  const [toggling, setToggling] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTask = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksAPI.getById(id);
      setTask(data);
    } catch (err) {
      setError(err.message || 'Task not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleToggleCompleted = async () => {
    if (!task) return;
    setToggling(true);
    try {
      const updated = await tasksAPI.patch(task.id, { completed: !task.completed });
      setTask(updated);
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await tasksAPI.delete(id);
      navigate('/tasks');
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <LoadingSpinner text="Loading task details..." />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="page-container">
        <Link to="/tasks" className="btn btn-secondary back-link">
          <ArrowLeft size={16} />
          <span>Back to Task List</span>
        </Link>
        <div style={{ marginTop: '1.5rem' }}>
          <ErrorAlert message={error || 'Task not found'} onRetry={fetchTask} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Navigation & Actions Top Bar */}
      <div className="detail-topbar">
        <Link to="/tasks" className="btn btn-secondary back-link">
          <ArrowLeft size={16} />
          <span>Back to All Tasks</span>
        </Link>

        <div className="detail-actions">
          <button
            type="button"
            className={task.completed ? 'btn btn-secondary' : 'btn btn-success'}
            onClick={handleToggleCompleted}
            disabled={toggling}
          >
            {task.completed ? (
              <>
                <Circle size={16} />
                <span>Mark as Pending</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Mark as Complete</span>
              </>
            )}
          </button>

          <Link to={`/tasks/${task.id}/edit`} className="btn btn-primary">
            <Edit2 size={16} />
            <span>Edit</span>
          </Link>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Task Details Card */}
      <div className="detail-card">
        <div className="detail-header">
          <div className="detail-title-wrapper">
            <h1 className={`detail-title ${task.completed ? 'completed' : ''}`}>
              {task.title}
            </h1>
            <span
              className={`badge badge-lg ${
                task.completed ? 'badge-success' : 'badge-warning'
              }`}
            >
              {task.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Timestamps Section */}
        <div className="detail-meta-grid">
          <div className="meta-item">
            <Calendar size={18} className="meta-icon" />
            <div>
              <span className="meta-label">Created At</span>
              <span className="meta-value">
                {new Date(task.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          <div className="meta-item">
            <Clock size={18} className="meta-icon" />
            <div>
              <span className="meta-label">Last Updated</span>
              <span className="meta-value">
                {new Date(task.updatedAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="detail-body">
          <h3 className="section-heading">Description</h3>
          {task.description ? (
            <div className="detail-description-text">
              {task.description.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ) : (
            <p className="detail-empty-description">
              No description provided for this task.
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${task.title}"? This cannot be recovered.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
