import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EditVisitorModal from '@/Components/Visitors/EditVisitorModal';

export default function VisitorsIndex() {
  const { props } = usePage();
  const blocks = props.blocks || [];
  const rooms = props.rooms || [];
  const activeVisitors = props.activeVisitors || [];
  const recentVisitors = props.recentVisitors || [];
  const flash = props.flash || {};

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [checkoutAt, setCheckoutAt] = useState({});
  const [editModal, setEditModal] = useState({ open: false, visitor: null });

  function localToISO(dtLocal) {
    if (!dtLocal) return '';
    // dtLocal like "2025-12-23T19:00" (no timezone). Interpret as local and convert to ISO (UTC)
    const d = new Date(dtLocal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
  }

  const form = useForm({
    visitor_name: '',
    company: '',
    phone: '',
    arrival_time: '',
    block_id: '',
    room_id: '',
    entry_reason: '',
  });

  const filteredRooms = useMemo(() => rooms.filter(r => String(r.block_id) === String(form.data.block_id)), [rooms, form.data.block_id]);

  useEffect(() => {
    let i;
    if (autoRefresh) {
      i = setInterval(() => {
        router.get(route('staff.visitors.index'), {}, { preserveScroll: true, preserveState: true });
      }, 10000);
    }
    return () => { if (i) clearInterval(i); };
  }, [autoRefresh]);

  useEffect(() => {
    if (form.data.room_id && !filteredRooms.some(r => String(r.id) === String(form.data.room_id))) {
      form.setData('room_id', '');
    }
  }, [filteredRooms, form.data.room_id]);

  function submit(e) {
    e.preventDefault();
    const payload = { ...form.data };
    if (payload.arrival_time) {
      const iso = localToISO(payload.arrival_time);
      if (iso) payload.arrival_time = iso;
    }
    form.post(route('staff.visitors.store'), {
      data: payload,
      onSuccess: () => form.reset('visitor_name','company','phone','arrival_time','block_id','room_id','entry_reason'),
    });
  }

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
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Visitors</h2>}>
      <Head title="Visitors" />
      <EditVisitorModal open={editModal.open} onClose={handleEditClose} onSave={handleEditSave} visitor={editModal.visitor || {}} blocks={blocks} rooms={rooms} />
      <div className="py-12 space-y-8">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-7xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold mb-4">Register Visitor Entry</h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input className="mt-1 w-full border rounded p-2" value={form.data.visitor_name} onChange={e => form.setData('visitor_name', e.target.value)} />
                {form.errors.visitor_name && <p className="text-sm text-red-600">{form.errors.visitor_name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Company</label>
                  <input className="mt-1 w-full border rounded p-2" value={form.data.company} onChange={e => form.setData('company', e.target.value)} />
                  {form.errors.company && <p className="text-sm text-red-600">{form.errors.company}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input className="mt-1 w-full border rounded p-2" value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} />
                  {form.errors.phone && <p className="text-sm text-red-600">{form.errors.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Block</label>
                  <select className="mt-1 w-full border rounded p-2" value={form.data.block_id} onChange={e => form.setData('block_id', e.target.value)}>
                    <option value="">Select block</option>
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {form.errors.block_id && <p className="text-sm text-red-600">{form.errors.block_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Room (optional)</label>
                  <select className="mt-1 w-full border rounded p-2" value={form.data.room_id} onChange={e => form.setData('room_id', e.target.value)}>
                    <option value="">Select room</option>
                    {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
                  </select>
                  {form.errors.room_id && <p className="text-sm text-red-600">{form.errors.room_id}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Reason</label>
                <input className="mt-1 w-full border rounded p-2" value={form.data.entry_reason} onChange={e => form.setData('entry_reason', e.target.value)} />
                {form.errors.entry_reason && <p className="text-sm text-red-600">{form.errors.entry_reason}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Arrival Time</label>
                <input required type="datetime-local" className="mt-1 w-full border rounded p-2" value={form.data.arrival_time} onChange={e => form.setData('arrival_time', e.target.value)} />
                {form.errors.arrival_time && <p className="text-sm text-red-600">{form.errors.arrival_time}</p>}
              </div>
              <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Record Entry</button>
            </form>
          </div>

          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Active Visitors</h3>
              <div className="flex items-center gap-3">
                <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => router.get(route('staff.visitors.index'), {}, { preserveScroll: true, preserveState: true })}>Refresh</button>
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
                  <tr><td colSpan="8" className="py-2 text-gray-500">No active visitors</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
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
      </div>
    </AuthenticatedLayout>
  );
}
