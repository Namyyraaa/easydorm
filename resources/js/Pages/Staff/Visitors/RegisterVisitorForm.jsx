import React, { useMemo } from 'react';
import { useForm, usePage } from '@inertiajs/react';

export default function RegisterVisitorForm() {
  const { props } = usePage();
  const blocks = props.blocks || [];
  const rooms = props.rooms || [];

  function localToISO(dtLocal) {
    if (!dtLocal) return '';
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

  const filteredRooms = useMemo(
    () => rooms.filter(r => String(r.block_id) === String(form.data.block_id)),
    [rooms, form.data.block_id]
  );

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

  return (
    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
      <h3 className="font-semibold mb-4">Register Visitor Entry</h3>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="mt-1 w-full border rounded p-2" value={form.data.visitor_name} onChange={e => form.setData('visitor_name', e.target.value)} />
          {form.errors.visitor_name && <p className="text-sm text-red-600">{form.errors.visitor_name}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  );
}
