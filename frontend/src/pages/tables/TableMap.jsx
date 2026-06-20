import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import './Tables.css';

const TableMap = () => {
  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reserveTarget, setReserveTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [form, setForm] = useState({ tableNumber: '', capacity: 4 });
  const [reserveName, setReserveName] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchTables(); }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/tables');
      setTables(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, reservedBy = null) => {
    setActionLoading(id);
    setError('');
    try {
      await axiosInstance.put(`/api/tables/${id}/status`, { status, reservedBy });
      await fetchTables();
      setReserveTarget(null);
      setCancelTarget(null);
      setReserveName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update table.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      await axiosInstance.post('/api/tables', form);
      setShowAddModal(false);
      setForm({ tableNumber: '', capacity: 4 });
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create table.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReserveSubmit = (e) => {
    e.preventDefault();
    if (!reserveName.trim()) return;
    updateStatus(reserveTarget.id, 'Reserved', reserveName.trim());
  };

  const filtered = filter === 'All' ? tables : tables.filter(t => t.status === filter);

  const statusColor = {
    Available: '#16a34a',
    Occupied: '#dc2626',
    Reserved: '#d97706',
  };
  const statusBg = {
    Available: '#d1fae5',
    Occupied: '#fee2e2',
    Reserved: '#fef3c7',
  };

  const counts = {
    Available: tables.filter(t => t.status === 'Available').length,
    Occupied: tables.filter(t => t.status === 'Occupied').length,
    Reserved: tables.filter(t => t.status === 'Reserved').length,
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">Monitor and manage restaurant tables</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={fetchTables}>↻ Refresh</button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Table</button>
        </div>
      </div>

      <div className="table-stats">
        <div className="table-stat" style={{ borderColor: '#16a34a' }}>
          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 24 }}>{counts.Available}</span>
          <span>Available</span>
        </div>
        <div className="table-stat" style={{ borderColor: '#dc2626' }}>
          <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 24 }}>{counts.Occupied}</span>
          <span>Occupied</span>
        </div>
        <div className="table-stat" style={{ borderColor: '#d97706' }}>
          <span style={{ color: '#d97706', fontWeight: 700, fontSize: 24 }}>{counts.Reserved}</span>
          <span>Reserved</span>
        </div>
      </div>

      <div className="filter-pills">
        {['All', 'Available', 'Occupied', 'Reserved'].map(f => (
          <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading tables...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <span style={{ fontSize: 40 }}>🪑</span>
          <p>No {filter !== 'All' ? filter.toLowerCase() : ''} tables found.</p>
        </div>
      ) : (
        <div className="tables-grid">
          {filtered.map(table => (
            <div key={table.id} className="table-card" style={{ borderLeftColor: statusColor[table.status] }}>
              <div className="table-card-header">
                <span className="table-number">{table.tableNumber}</span>
                <span className="table-status-badge" style={{ background: statusBg[table.status], color: statusColor[table.status] }}>
                  {table.status}
                </span>
              </div>
              <div className="table-capacity">👥 {table.capacity} seats</div>

              {table.status === 'Reserved' && table.reservedBy && (
                <div className="reserved-by">📅 Reserved for: <strong>{table.reservedBy}</strong></div>
              )}

              {/* Action buttons per status */}
              {table.status === 'Available' && (
                <div className="table-actions">
                  <button
                    className="btn-primary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => updateStatus(table.id, 'Occupied')}
                  >
                    {actionLoading === table.id ? '...' : 'Seat Walk-in'}
                  </button>
                  <button
                    className="btn-secondary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => setReserveTarget(table)}
                  >
                    📅 Reserve
                  </button>
                </div>
              )}

              {table.status === 'Occupied' && (
                <button
                  className="btn-secondary table-btn"
                  disabled={actionLoading === table.id}
                  onClick={() => updateStatus(table.id, 'Available')}
                >
                  {actionLoading === table.id ? '...' : 'Mark Available'}
                </button>
              )}

              {table.status === 'Reserved' && (
                <div className="table-actions">
                  <button
                    className="btn-primary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => updateStatus(table.id, 'Occupied')}
                  >
                    {actionLoading === table.id ? '...' : 'Seat Customer'}
                  </button>
                  <button
                    className="btn-secondary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => setCancelTarget(table)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Table</h3>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              {error && <div className="login-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Table Number</label>
                <input className="form-input" placeholder="e.g. T-09" value={form.tableNumber} onChange={e => setForm({ ...form, tableNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input className="form-input" type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={actionLoading === 'create'}>
                  {actionLoading === 'create' ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reserve Table Modal */}
      {reserveTarget && (
        <div className="modal-overlay" onClick={() => { setReserveTarget(null); setReserveName(''); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#d97706' }}>
              <h3>Reserve {reserveTarget.tableNumber}</h3>
              <button onClick={() => { setReserveTarget(null); setReserveName(''); }}>✕</button>
            </div>
            <form onSubmit={handleReserveSubmit} className="modal-body">
              {error && <div className="login-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Maria Santos"
                  value={reserveName}
                  onChange={e => setReserveName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setReserveTarget(null); setReserveName(''); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#d97706' }} disabled={actionLoading === reserveTarget.id}>
                  {actionLoading === reserveTarget.id ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Reservation Confirm */}
      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal-box confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#dc2626' }}>
              <h3>Cancel Reservation</h3>
              <button onClick={() => setCancelTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#374151', marginBottom: 20 }}>
                Cancel the reservation for <strong>{cancelTarget.reservedBy}</strong> at <strong>{cancelTarget.tableNumber}</strong>? The table will become Available again.
              </p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setCancelTarget(null)}>Keep Reservation</button>
                <button
                  className="btn-primary"
                  style={{ background: '#dc2626' }}
                  disabled={actionLoading === cancelTarget.id}
                  onClick={() => updateStatus(cancelTarget.id, 'Available')}
                >
                  {actionLoading === cancelTarget.id ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default TableMap;