import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { getTaskRole, STATUS_LABELS } from '../utils/taskRole';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api('/api/tasks')
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load tasks');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Signed in as {user?.email}
            {user?.name ? ` (${user.name})` : ''}
          </p>
        </div>
        <div className="topbar-actions">
          <Link to="/tasks/new" className="btn primary">
            New task
          </Link>
          <button type="button" className="btn ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className="section">
        {loading ? (
          <p className="muted">Loading tasks…</p>
        ) : error ? (
          <div className="banner error">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet.</p>
            <Link to="/tasks/new" className="btn primary">
              Create your first task
            </Link>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task._id} className="task-card">
                <div className="task-card-main">
                  <div className="task-title-row">
                    <h2>{task.title}</h2>
                    <span className={`badge status-${task.status}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                  </div>
                  <p className="task-meta">
                    <span className="badge subtle">{task.taskType === 'personal' ? 'Personal' : 'Assigned'}</span>
                    {task.taskType === 'assigned' && (
                      <>
                        <span className="muted">
                          {' '}
                          From: {task.createdBy?.email || '—'} · To:{' '}
                          {task.assignee?.email || '—'}
                        </span>
                      </>
                    )}
                  </p>
                  {task.description ? (
                    <p className="task-desc">{task.description}</p>
                  ) : null}
                  <p className="muted small">
                    Due:{' '}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div className="task-card-actions">
                  {getTaskRole(task, user?.id) ? (
                    <Link to={`/tasks/${task._id}/edit`} className="btn small">
                      Open
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
