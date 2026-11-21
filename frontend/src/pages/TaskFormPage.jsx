import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { ArrowLeft, Save, CheckCircle2, Circle } from 'lucide-react';

export default function TaskFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);

  // Field errors (client-side validation)
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // API states
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // If in edit mode, fetch the existing task
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    async function fetchExistingTask() {
      setFetchLoading(true);
      setApiError(null);
      try {
        const task = await tasksAPI.getById(id);
        if (isMounted) {
          setTitle(task.title || '');
          setDescription(task.description || '');
          setCompleted(Boolean(task.completed));
        }
      } catch (err) {
        if (isMounted) {
          setApiError(err.message || 'Failed to fetch task details.');
        }
      } finally {
        if (isMounted) setFetchLoading(false);
      }
    }

    fetchExistingTask();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Client-side validation function
  const validate = () => {
    const errs = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      errs.title = 'Title is required.';
    } else if (trimmedTitle.length > 200) {
      errs.title = 'Title must be 200 characters or fewer.';
    }

    if (description && description.length > 2000) {
      errs.description = 'Description must be 2000 characters or fewer.';
    }

    return errs;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (touched.title) {
      setErrors((prev) => ({
        ...prev,
        title: !val.trim()
          ? 'Title is required.'
          : val.trim().length > 200
          ? 'Title must be 200 characters or fewer.'
          : undefined,
      }));
    }
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    if (touched.description) {
      setErrors((prev) => ({
        ...prev,
        description: val.length > 2000 ? 'Description must be 2000 characters or fewer.' : undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ title: true, description: true });

    // Validate
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitLoading(true);
    setApiError(null);

    try {
      if (isEditMode) {
        await tasksAPI.update(id, {
          title: title.trim(),
          description: description || '',
          completed,
        });
        navigate(`/tasks/${id}`);
      } else {
        const created = await tasksAPI.create({
          title: title.trim(),
          description: description || '',
          completed,
        });
        navigate(`/tasks/${created.id}`);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to save task.');
      setSubmitLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <LoadingSpinner text="Loading task information..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="detail-topbar">
        <Link
          to={isEditMode ? `/tasks/${id}` : '/tasks'}
          className="btn btn-secondary back-link"
        >
          <ArrowLeft size={16} />
          <span>{isEditMode ? 'Cancel & Return to Task' : 'Back to Task List'}</span>
        </Link>
      </div>

      <div className="form-card">
        <div className="form-header">
          <h1 className="form-title">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </h1>
          <p className="form-subtitle">
            {isEditMode
              ? 'Modify details and update the status of your task.'
              : 'Add a new item to your todo list with details and progress.'}
          </p>
        </div>

        {apiError && <ErrorAlert message={apiError} />}

        <form onSubmit={handleSubmit} noValidate className="form-layout">
          {/* Title Field */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="task-title" className="form-label">
                Task Title <span className="required-star">*</span>
              </label>
              <span
                className={`char-counter ${title.length > 200 ? 'char-overflow' : ''}`}
              >
                {title.length} / 200
              </span>
            </div>
            <input
              id="task-title"
              type="text"
              className={`form-input ${errors.title && touched.title ? 'input-error' : ''}`}
              placeholder="e.g. Implement user authentication in Express"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => handleBlur('title')}
              disabled={submitLoading}
              autoFocus
            />
            {errors.title && touched.title && (
              <p className="field-error-text" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="task-description" className="form-label">
                Description <span className="optional-tag">(Optional)</span>
              </label>
              <span
                className={`char-counter ${description.length > 2000 ? 'char-overflow' : ''}`}
              >
                {description.length} / 2000
              </span>
            </div>
            <textarea
              id="task-description"
              className={`form-textarea ${
                errors.description && touched.description ? 'input-error' : ''
              }`}
              rows={5}
              placeholder="Provide more context, action steps, or notes..."
              value={description}
              onChange={handleDescriptionChange}
              onBlur={() => handleBlur('description')}
              disabled={submitLoading}
            />
            {errors.description && touched.description && (
              <p className="field-error-text" role="alert">
                {errors.description}
              </p>
            )}
          </div>

          {/* Completed Checkbox */}
          <div className="form-group">
            <label className="checkbox-custom-label">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                disabled={submitLoading}
                className="checkbox-hidden"
              />
              <span className="checkbox-box">
                {completed ? (
                  <CheckCircle2 size={20} className="checkbox-icon checked" />
                ) : (
                  <Circle size={20} className="checkbox-icon unchecked" />
                )}
              </span>
              <span className="checkbox-label-text">
                Mark as completed
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(isEditMode ? `/tasks/${id}` : '/tasks')}
              disabled={submitLoading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <LoadingSpinner text="" size={16} />
                  <span>{isEditMode ? 'Saving Changes...' : 'Creating Task...'}</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{isEditMode ? 'Save Changes' : 'Create Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
