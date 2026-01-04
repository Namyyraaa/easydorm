import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

export default function StaffFinesIndex() {
  const { props } = usePage();
  const items = props.items || [];
  const students = props.students || [];
  const rooms = props.rooms || [];
  const categories = props.categories || [];
  const statuses = props.statuses || [];
  const flash = props.flash || {};

  const filterForm = useForm({ student_id: '', block_id: '', room_id: '', category: '', status: '' });
  const form = useForm({ student_id: '', room_id: '', block_id: '', category: categories[0] || '', amount_rm: '', reason: '', offence_date: '', due_date: '', evidence: [] });
  const [previews, setPreviews] = useState([]);

  const blocks = useMemo(() => {
    const map = new Map();
    rooms.forEach(r => { if (r.block && r.block_id) map.set(r.block_id, r.block); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const onEvidenceChange = (files) => {
    const arr = Array.from(files || []);
    if (arr.length > 10) {
      alert('Maximum 10 files');
      return;
    }
    form.setData('evidence', arr);
    const urls = arr.filter(f => f.type.startsWith('image/')).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const submitNew = (e) => {
    e.preventDefault();
    form.post(route('staff.fines.store'), { forceFormData: true, preserveScroll: true, onSuccess: () => { setPreviews([]); form.reset('student_id','room_id','block_id','category','amount_rm','reason','offence_date','due_date','evidence'); } });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filterForm.data).forEach(([k,v]) => { if (v) params.set(k, v); });
    const url = route('staff.fines.index') + (params.toString() ? ('?'+params.toString()) : '');
    window.location.href = url;
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Fines</h2>}>
      <Head title="Fines" />
      <div className="py-12 space-y-6">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-6xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}

        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Issue New Fine</h3>
            <form onSubmit={submitNew} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Resident</label>
                <select className="mt-1 w-full border rounded p-2" value={form.data.student_id} onChange={(e) => form.setData('student_id', e.target.value)}>
                  <option value="">Select resident...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} (ID {s.id})</option>)}
                </select>
                {form.errors.student_id && <p className="text-sm text-red-600">{form.errors.student_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Block (optional)</label>
                  <select className="mt-1 w-full border rounded p-2" value={form.data.block_id} onChange={(e) => form.setData('block_id', e.target.value)}>
                    <option value="">Auto from resident</option>
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Room (optional)</label>
                  <select className="mt-1 w-full border rounded p-2" value={form.data.room_id} onChange={(e) => form.setData('room_id', e.target.value)}>
                    <option value="">Auto from resident</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.block} — {r.room_number}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <select className="mt-1 w-full border rounded p-2" value={form.data.category} onChange={(e) => form.setData('category', e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Amount (RM)</label>
                  <input className="mt-1 w-full border rounded p-2" type="number" step="0.01" value={form.data.amount_rm} onChange={(e) => form.setData('amount_rm', e.target.value)} />
                  {form.errors.amount_rm && <p className="text-sm text-red-600">{form.errors.amount_rm}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Reason / Description</label>
                <textarea className="mt-1 w-full border rounded p-2" rows={4} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                {form.errors.reason && <p className="text-sm text-red-600">{form.errors.reason}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Date of offence</label>
                  <input className="mt-1 w-full border rounded p-2" type="date" value={form.data.offence_date} onChange={(e) => form.setData('offence_date', e.target.value)} />
                  {form.errors.offence_date && <p className="text-sm text-red-600">{form.errors.offence_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Due date</label>
                  <input className="mt-1 w-full border rounded p-2" type="date" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} />
                  {form.errors.due_date && <p className="text-sm text-red-600">{form.errors.due_date}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Evidence (images or PDF, up to 10)</label>
                <input type="file" accept="image/*,application/pdf" multiple className="mt-1 w-full" onChange={(e) => onEvidenceChange(e.target.files)} />
                {form.errors['evidence.*'] && <p className="text-sm text-red-600">{form.errors['evidence.*']}</p>}
                {previews.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {previews.map((src, idx) => (
                      <img src={src} key={idx} alt="preview" className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Issue Fine</button>
            </form>
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Fines List</h3>
            <form onSubmit={applyFilters} className="grid grid-cols-2 gap-3 mb-4">
              <select className="border rounded p-2" value={filterForm.data.student_id} onChange={(e) => filterForm.setData('student_id', e.target.value)}>
                <option value="">Filter by student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} (ID {s.id})</option>)}
              </select>
              <select className="border rounded p-2" value={filterForm.data.block_id} onChange={(e) => filterForm.setData('block_id', e.target.value)}>
                <option value="">Filter by block</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className="border rounded p-2" value={filterForm.data.room_id} onChange={(e) => filterForm.setData('room_id', e.target.value)}>
                <option value="">Filter by room</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.block} — {r.room_number}</option>)}
              </select>
              <select className="border rounded p-2" value={filterForm.data.category} onChange={(e) => filterForm.setData('category', e.target.value)}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="border rounded p-2" value={filterForm.data.status} onChange={(e) => filterForm.setData('status', e.target.value)}>
                <option value="">All statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="px-3 py-2 bg-gray-100 rounded">Apply Filters</button>
            </form>

            <div className="divide-y">
              {items.map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.fine_code} — RM {Number(it.amount_rm).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{it.category} • Due {new Date(it.due_date).toLocaleDateString()} • <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{it.status}</span></div>
                    <div className="text-xs text-gray-500">{it.block?.name || ''} {it.room?.room_number ? `— Room ${it.room.room_number}` : ''}</div>
                  </div>
                  <Link href={route('staff.fines.show', it.id)} className="text-indigo-600 hover:underline">View</Link>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-gray-600">No fines found.</p>}
            </div>

            <div className="mt-4">
              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(); fd.append('days', '3'); fetch(route('staff.fines.notifyUpcoming'), { method: 'POST', headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '') }, body: fd }).then(() => window.location.reload()); }}>
                <button type="submit" className="px-3 py-2 bg-yellow-500 text-white rounded">Notify Upcoming Due (3 days)</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
