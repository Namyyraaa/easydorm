import React, { useEffect, useMemo, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import EditVisitorModal from '@/Components/Visitors/EditVisitorModal';

export default function VisitorLists() {
  const { props } = usePage();
  const blocks = props.blocks || [];
  const rooms = props.rooms || [];
  const activeVisitors = props.activeVisitors || [];
  const recentVisitors = props.recentVisitors || [];

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [checkoutAt, setCheckoutAt] = useState({});
  const [editModal, setEditModal] = useState({ open: false, visitor: null });

  function localToISO(dtLocal) {
    if (!dtLocal) return '';
    const d = new Date(dtLocal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
  }

  useEffect(() => {
    let i;
    if (autoRefresh) {
      i = setInterval(() => {
        router.get(route('staff.visitors.index', { tab: 'list' }), {}, { preserveScroll: true, preserveState: true });
      }, 10000);
    }
    return () => { if (i) clearInterval(i); };
  }, [autoRefresh]);

  function checkout(id) {
    const value = checkoutAt[id];
    const payload = value ? { out_time: localToISO(value) || '' } : {};
    router.patch(route('staff.visitors.checkout', id), payload, { preserveScroll: true });
  }

  function updateRow(id, payload) {
    if (payload?.arrival_time) {
      const iso = localToISO(payload.arrival_time);
      if (iso) payload.arrival_time = iso;
    }
    if (payload?.out_time) {
      const isoO = localToISO(payload.out_time);
      if (isoO) payload.out_time = isoO;
    }
    router.patch(route('staff.visitors.update', id), payload, { preserveScroll: true });
  }

  function handleEdit(visitor) {
    setEditModal({ open: true, visitor });
  }
  function handleEditSave(form) {
    const id = editModal.visitor?.id;
    setEditModal({ open: false, visitor: null });
    if (id) updateRow(id, form);
  }
  function handleEditClose() {
    setEditModal({ open: false, visitor: null });
  }
  function handleDelete(id) {
    if (window.confirm('Delete this visitor log?')) {
      router.delete(route('staff.visitors.destroy', id), { preserveScroll: true });
    }
  }

  return (
    <div className="space-y-6">
      <EditVisitorModal open={editModal.open} onClose={handleEditClose} onSave={handleEditSave} visitor={editModal.visitor || {}} blocks={blocks} rooms={rooms} />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Active Visitors</h3>
          <div className="flex items-center gap-3">
            <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => router.get(route('staff.visitors.index', { tab: 'list' }), {}, { preserveScroll: true, preserveState: true })}>Refresh</button>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> Auto refresh
            </label>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="py-2 text-left">Name</th>
              <th className="text-left">Company</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Block</th>
              <th className="text-left">Room</th>
              <th className="text-left">Arrival</th>
              <th className="text-left">Reason</th>
              <th className="text-left">Checkout At (optional)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeVisitors.map(v => (
              <tr key={v.id} className="border-t">
                <td className="py-2">{v.visitor_name}</td>
                <td>{v.company || '-'}</td>
                <td>{v.phone || '-'}</td>
                <td>{v.block?.name || '-'}</td>
                <td>{v.room?.room_number || '-'}</td>
                <td>{new Date(v.arrival_time).toLocaleString()}</td>
                <td>{v.entry_reason || '-'}</td>
                <td>
                  <input
                    type="datetime-local"
                    className="border rounded px-2 py-1"
                    value={checkoutAt[v.id] || ''}
                    onChange={e => setCheckoutAt(prev => ({ ...prev, [v.id]: e.target.value }))}
                  />
                </td>
                <td className="text-right flex gap-2">
                  <button type="button" className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => checkout(v.id)}>Checkout</button>
                  <button type="button" className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEdit(v)}>Edit</button>
                  <button type="button" className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(v.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {activeVisitors.length === 0 && (
              <tr><td colSpan="9" className="py-2 text-gray-500">No active visitors</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
        <h3 className="font-semibold mb-3">Recent Checkouts</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="py-2 text-left">Name</th>
              <th className="text-left">Company</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Block</th>
              <th className="text-left">Room</th>
              <th className="text-left">Arrival</th>
              <th className="text-left">Out</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentVisitors.map(v => (
              <tr key={v.id} className="border-t">
                <td className="py-2">{v.visitor_name}</td>
                <td>{v.company || '-'}</td>
                <td>{v.phone || '-'}</td>
                <td>{blocks.find(b => b.id === v.block_id)?.name || '-'}</td>
                <td>{rooms.find(r => r.id === v.room_id)?.room_number || '-'}</td>
                <td>{new Date(v.arrival_time).toLocaleString()}</td>
                <td>{new Date(v.out_time).toLocaleString()}</td>
                <td className="text-right flex gap-2">
                  <button type="button" className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEdit(v)}>Edit</button>
                  <button type="button" className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(v.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {recentVisitors.length === 0 && (
              <tr><td colSpan="8" className="py-2 text-gray-500">No recent activity</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
