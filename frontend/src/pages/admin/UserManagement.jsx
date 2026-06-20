import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import './Admin.css';

const ROLES = [
  { id: 1, name: 'SuperAdmin' },
  { id: 2, name: 'Admin' },
  { id: 3, name: 'Manager' },
  { id: 4, name: 'Waiter' },
  { id: 5, name: 'Cashier' },
  { id: 6, name: 'KitchenStaff' },
];

const roleColors = {
  SuperAdmin: { bg: '#f3f4f6', color: '#111827' },
  Admin: { bg: '#fee2e2', color: '#991b1b' },
  Manager: { bg: '#ede9fe', color: '#5b21b6' },
  Waiter: { bg: '#ffedd5', color: '#9a3412' },
  Cashier: { bg: '#dbeafe', color: '#1e40af' },
  KitchenStaff: { bg: '#d1fae5', color: '#065f46' },
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRole, setFilterRole] = useState('All');
  const [search, setSearch] = useState('');
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: '',
    branch: 'Main Branch'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/api/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await axiosInstance.post('/api/users', form);
      setShowModal(false);
      setForm({ fullName: '', email: '', password: '', roleId: '', branch: 'Main Branch' });
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (user) => {
    try {
      await axiosInstance.put(`/api/users/${user.id}/toggle-status`);
      setConfirmToggle(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const filtered = users
    .filter(u => filterRole === 'All' || u.role === filterRole)
    .filter(u =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users, roles and access</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
      </div>

{/* Summary Cards */}
<div className="user-stats">
  <div className="user-stat">
    <span className="user-stat-value">{counts.total}</span>
    <span className="user-stat-label">Total Users</span>
  </div>
  <div className="user-stat active">
    <span className="user-stat-value">{counts.active}</span>
    <span className="user-stat-label">Active</span>
  </div>
  <div className="user-stat inactive">
    <span className="user-stat-value">{counts.inactive}</span>
    <span className="user-stat-label">Inactive</span>
  </div>
</div>

      {/* Filters */}
      <div className="user-filters">
        <div className="topbar-search" style={{ maxWidth: 300 }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {['All', ...ROLES.map(r => r.name)].map(r => (
            <button
              key={r}
              className={`filter-pill ${filterRole === r ? 'active' : ''}`}
              onClick={() => setFilterRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="loading">Loading users...</div> : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div
                        className="user-avatar-sm"
                        style={{
                          background: roleColors[user.role]?.bg || '#f3f4f6',
                          color: roleColors[user.role]?.color || '#111827'
                        }}
                      >
                        {getInitials(user.fullName)}
                      </div>
                      <strong>{user.fullName}</strong>
                    </div>
                  </td>
                  <td style={{ color: '#6b7280' }}>{user.email}</td>
                  <td>
                    <span className="status-badge" style={roleColors[user.role]}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.branch}</td>
                  <td>
                    <span className="status-badge" style={
                      user.isActive
                        ? { background: '#d1fae5', color: '#065f46' }
                        : { background: '#f3f4f6', color: '#6b7280' }
                    }>
                      {user.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn-toggle ${user.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => setConfirmToggle(user)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              {formError && <div className="login-error">{formError}</div>}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Juan Dela Cruz"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="e.g. juan@flavorrush.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={form.roleId}
                    onChange={e => setForm({ ...form, roleId: e.target.value })}
                    required
                  >
                    <option value="">Select role</option>
                    {ROLES.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <input
                    className="form-input"
                    value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Toggle Modal */}
      {confirmToggle && (
        <div className="modal-overlay" onClick={() => setConfirmToggle(null)}>
          <div className="modal-box confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: confirmToggle.isActive ? '#dc2626' : '#16a34a' }}>
              <h3>{confirmToggle.isActive ? 'Deactivate User' : 'Activate User'}</h3>
              <button onClick={() => setConfirmToggle(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#374151', marginBottom: 20 }}>
                Are you sure you want to <strong>{confirmToggle.isActive ? 'deactivate' : 'activate'}</strong> <strong>{confirmToggle.fullName}</strong>?
                {confirmToggle.isActive && ' They will no longer be able to log in.'}
              </p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setConfirmToggle(null)}>Cancel</button>
                <button
                  className="btn-primary"
                  style={{ background: confirmToggle.isActive ? '#dc2626' : '#16a34a' }}
                  onClick={() => handleToggle(confirmToggle)}
                >
                  {confirmToggle.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserManagement;