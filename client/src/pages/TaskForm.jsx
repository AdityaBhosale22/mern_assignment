import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { getTaskRole, STATUS_LABELS } from '../utils/taskRole';

const STATUSES = ['todo', 'in_progress', 'done'];

export default function TaskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [taskType, setTaskType] = useState('personal');
  const [assigneeId, setAssigneeId] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!isEdit) {
      api('/api/users')
        .then(setUsers)
        .catch(() => setUsers([]));
      return;
    }
    let cancelled = false;
    api(`/api/tasks/${id}`)
      .then((t) => {
        if (cancelled) return;
        setTask(t);
        setTitle(t.title);
        setDescription(t.description || '');
        setStatus(t.status);
        setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : '');
        setTaskType(t.taskType);
        if (t.assignee?._id) setAssigneeId(t.assignee._id);
      })
      .catch((err) => setError(err.message || 'Failed to load task'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  useEffect(() => {
    if (isEdit && taskType === 'assigned' && !assigneeId && task?.assignee?._id) {
      setAssigneeId(task.assignee._id);
    }
  }, [isEdit, taskType, assigneeId, task]);

  const role = task && user ? getTaskRole(task, user.id) : isEdit ? null : 'owner';

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description,
        status,
        dueDate: dueDate || null,
        taskType,
        ...(taskType === 'assigned' ? { assigneeId } : {}),
      };
      if (taskType === 'assigned' && !assigneeId) {
        setError('Choose an assignee');
        setSaving(false);
        return;
      }
      await api('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not create task');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (role === 'owner') {
        await api(`/api/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            description,
            status,
            dueDate: dueDate || null,
          }),
        });
      } else if (role === 'assigner') {
        await api(`/api/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ dueDate: dueDate || null }),
        });
      } else if (role === 'assignee') {
        await api(`/api/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not update task');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task?')) return;
    setError('');
    setSaving(true);
    try {
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not delete');
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && loading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (isEdit && !task && !loading) {
    return (
      <div className="page">
        <div className="banner error">{error || 'Task not found'}</div>
        <Link to="/">Back</Link>
      </div>
    );
  }

  if (isEdit && task && user && !getTaskRole(task, user.id)) {
    return (
      <div className="page">
        <div className="banner error">You do not have access to this task.</div>
        <Link to="/">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>{isEdit ? 'Edit task' : 'New task'}</h1>
          <p className="muted">
            <Link to="/">← Dashboard</Link>
          </p>
        </div>
      </header>

      <div className="card form-card">
        {error ? <div className="banner error">{error}</div> : null}

        {!isEdit ? (
          <form onSubmit={handleCreate} className="form">
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving}
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={saving}
              />
            </label>
            <fieldset className="fieldset">
              <legend>Task type</legend>
              <label className="inline">
                <input
                  type="radio"
                  name="taskType"
                  checked={taskType === 'personal'}
                  onChange={() => setTaskType('personal')}
                  disabled={saving}
                />
                Personal
              </label>
              <label className="inline">
                <input
                  type="radio"
                  name="taskType"
                  checked={taskType === 'assigned'}
                  onChange={() => setTaskType('assigned')}
                  disabled={saving}
                />
                Assigned
              </label>
            </fieldset>
            {taskType === 'assigned' ? (
              <label>
                Assign to
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  required={taskType === 'assigned'}
                  disabled={saving}
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email} {u.name ? `(${u.name})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={saving}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={saving}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : 'Create task'}
              </button>
              <Link to="/" className="btn ghost">
                Cancel
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdate} className="form">
            <p className="muted small">
              {role === 'assigner' && 'You are the assigner: you may update the due date only.'}
              {role === 'assignee' && 'You are the assignee: you may update the status only.'}
              {role === 'owner' && 'Personal task: you may edit all fields.'}
            </p>

            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={saving || role === 'assigner' || role === 'assignee'}
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={saving || role === 'assigner' || role === 'assignee'}
              />
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving || role === 'assigner'}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={saving || role === 'assignee'}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {(role === 'owner' || role === 'assigner') && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Delete
                </button>
              )}
              <Link to="/" className="btn ghost">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
