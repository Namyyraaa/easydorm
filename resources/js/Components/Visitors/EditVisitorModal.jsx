import React, { useEffect, useMemo, useState } from 'react';

export default function EditVisitorModal({ open, onClose, onSave, visitor = {}, blocks = [], rooms = [] }) {
  const [form, setForm] = useState({ ...visitor });
  useEffect(() => { setForm({ ...visitor }); }, [visitor]);
  const filteredRooms = useMemo(() => rooms.filter(r => String(r.block_id) === String(form.block_id)), [rooms, form.block_id]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
        <h3 className="font-semibold mb-4">Edit Visitor</h3>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 w-full border rounded p-2" value={form.visitor_name || ''} onChange={e => setForm(f => ({ ...f, visitor_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Company</label>
              <input className="mt-1 w-full border rounded p-2" value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input className="mt-1 w-full border rounded p-2" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Block</label>
              <select className="mt-1 w-full border rounded p-2" value={form.block_id || ''} onChange={e => setForm(f => ({ ...f, block_id: e.target.value, room_id: '' }))}>
                <option value="">Select block</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Room (optional)</label>
              <select className="mt-1 w-full border rounded p-2" value={form.room_id || ''} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))}>
                <option value="">Select room</option>
                {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.room_number}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <input className="mt-1 w-full border rounded p-2" value={form.entry_reason || ''} onChange={e => setForm(f => ({ ...f, entry_reason: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium">Arrival Time</label>
            <input type="datetime-local" className="mt-1 w-full border rounded p-2" value={form.arrival_time ? String(form.arrival_time).slice(0,16) : ''} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
          </div>
          {form.out_time !== undefined && (
            <div>
              <label className="block text-sm font-medium">Checkout Time</label>
              <input type="datetime-local" className="mt-1 w-full border rounded p-2" value={form.out_time ? String(form.out_time).slice(0,16) : ''} onChange={e => setForm(f => ({ ...f, out_time: e.target.value }))} />
            </div>
          )}
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
