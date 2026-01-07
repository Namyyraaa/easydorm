import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function StaffFinesIndex() {
  const { props } = usePage();
  const items = props.items || [];
  const students = props.students || [];
  const rooms = props.rooms || [];
  const categories = props.categories || [];
  const flash = props.flash || {};
  const initialTab = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) || 'issue';
  const [activeTab, setActiveTab] = useState(initialTab === 'list' ? 'list' : 'issue');

  // Fines list filters + pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchStudentId, setSearchStudentId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const humanize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const badgeClassFor = (s) => {
    switch (s) {
      case 'pending':
        return 'bg-sky-100 text-sky-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'paid':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'waived':
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'unpaid':
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '';
    try {
      return new Date(dt).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const listStatuses = useMemo(() => {
    const s = new Set(items.map(r => r.status).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [items]);

  const listBlocks = useMemo(() => {
    const b = new Set(items.map(r => r.block?.name).filter(Boolean));
    return ['all', ...Array.from(b)];
  }, [items]);

  const roomOptions = useMemo(() => {
    if (blockFilter === 'all') return ['all'];
    const filteredByBlock = items.filter(r => (r.block?.name === blockFilter));
    const set = new Set(filteredByBlock.map(r => r.room?.room_number).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [items, blockFilter]);

  const filtered = useMemo(() => {
    return items.filter(r => (
      (statusFilter === 'all' || r.status === statusFilter) &&
      (blockFilter === 'all' || r.block?.name === blockFilter) &&
      (roomFilter === 'all' || r.room?.room_number === roomFilter) &&
      (searchStudentId == null || String(r.student?.id) === String(searchStudentId))
    ));
  }, [items, statusFilter, blockFilter, roomFilter, searchStudentId]);

  useEffect(() => { setPage(1); }, [statusFilter, blockFilter, roomFilter]);
  useEffect(() => { setRoomFilter('all'); }, [blockFilter]);

  // Persist active tab to URL so back/refresh keeps the same tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeTab === 'issue') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', 'list');
    }
    window.history.replaceState({}, '', url);
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  // Issue new fine form
  const filterForm = useForm({ student_id: '', block_id: '', room_id: '', category: '', status: '' });
  const form = useForm({ student_id: '', room_id: '', block_id: '', category: categories[0] || '', amount_rm: '', reason: '', offence_date: '', due_date: '', evidence: [] });
  const [previews, setPreviews] = useState([]);
  const todayStr = new Date().toISOString().split('T')[0];

  const blocks = useMemo(() => {
    const map = new Map();
    rooms.forEach(r => { if (r.block && r.block_id) map.set(r.block_id, r.block); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const onEvidenceChange = (files) => {
    const arr = Array.from(files || []);
    if (arr.length > 5) {
      alert('Maximum 5 files');
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

  // Legacy list filters were server-side; now using client-side filters above.

  const evidenceErrorMessages = React.useMemo(() => {
    const errs = form.errors || {};
    return Object.keys(errs)
      .filter((k) => k === 'evidence' || k.startsWith('evidence.'))
      .map((k) => errs[k]);
  }, [form.errors]);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Fines</h2>}>
      <Head title="Fines" />
      <div className="py-12 space-y-6">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-6xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}

        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          <div className="border-b border-violet-200 mb-6">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('issue')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium ${activeTab === 'issue' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Issue New Fine
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium ${activeTab === 'list' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Fines List
              </button>
            </nav>
          </div>

          {activeTab === 'issue' && (
            <div className="overflow-hidden rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
              <h3 className="font-semibold mb-3 text-violet-900">Issue New Fine</h3>
              <form onSubmit={submitNew} className="space-y-4 text-violet-900 flex flex-col">
                <ResidentSearch
                  students={students}
                  valueId={form.data.student_id}
                  onSelect={(s) => { form.setData('student_id', s?.id || ''); }}
                  error={form.errors.student_id}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Block (optional)</label>
                    <select className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={form.data.block_id} onChange={(e) => form.setData('block_id', e.target.value)}>
                      <option value="">Auto from resident</option>
                      {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Room (optional)</label>
                    <select className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={form.data.room_id} onChange={(e) => form.setData('room_id', e.target.value)}>
                      <option value="">Auto from resident</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.block} — {r.room_number}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Category</label>
                    <select className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={form.data.category} onChange={(e) => form.setData('category', e.target.value)}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Amount (RM)</label>
                    <input className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" type="number" step="0.01" value={form.data.amount_rm} onChange={(e) => form.setData('amount_rm', e.target.value)} />
                    {form.errors.amount_rm && <p className="text-sm text-red-600">{form.errors.amount_rm}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-800">Reason / Description</label>
                  <textarea className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" rows={4} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                  {form.errors.reason && <p className="text-sm text-red-600">{form.errors.reason}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Date of offence</label>
                    <input className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" type="date" value={form.data.offence_date} onChange={(e) => form.setData('offence_date', e.target.value)} />
                    {form.errors.offence_date && <p className="text-sm text-red-600">{form.errors.offence_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Due date</label>
                    <input className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" type="date" min={todayStr} value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} />
                    {form.errors.due_date && <p className="text-sm text-red-600">{form.errors.due_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-800">Evidence (images or PDF, up to 5)</label>
                  <input id="evidence" type="file" accept="image/*,application/pdf" multiple className="sr-only" onChange={(e) => onEvidenceChange(e.target.files)} />
                  <label htmlFor="evidence" className="mt-1 inline-flex items-center rounded-lg border border-violet-300 bg-white px-4 py-2 text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer">Choose files</label>
                  <p className="mt-1 text-xs text-gray-500">You can select multiple images or PDFs (max 10).</p>
                  {evidenceErrorMessages.map((msg, i) => (
                    <p key={i} className="text-sm text-red-600">{msg}</p>
                  ))}
                  {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {previews.map((src, idx) => (
                        <img src={src} key={idx} alt="preview" className="w-full h-24 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="submit" disabled={form.processing} className="inline-flex items-center rounded-lg bg-violet-600 px-6 py-3 text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400">Issue Fine</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="font-semibold mb-3">Fines List</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-3">
                  <div className="flex items-center w-64">
                    <ResidentSearch
                      label=""
                      compact
                      students={students}
                      valueId={searchStudentId}
                      onSelect={(s) => setSearchStudentId(s?.id ?? null)}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Status</label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                    >
                      {listStatuses.map(s => (
                        <option key={s} value={s}>{s === 'all' ? 'All' : humanize(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Block</label>
                    <select
                      value={blockFilter}
                      onChange={e => setBlockFilter(e.target.value)}
                      className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] max-h-60 overflow-y-auto focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                    >
                      {listBlocks.map(b => (
                        <option key={b} value={b}>{b === 'all' ? 'All' : b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Room</label>
                    <select
                      value={roomFilter}
                      onChange={e => setRoomFilter(e.target.value)}
                      disabled={blockFilter === 'all'}
                      className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] max-h-60 overflow-y-auto focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {roomOptions.map(r => (
                        <option key={r} value={r}>{r === 'all' ? 'All' : r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={() => { setStatusFilter('all'); setBlockFilter('all'); setRoomFilter('all'); setSearchStudentId(null); }} className="text-sm text-gray-600 hover:underline">Reset</button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="py-2 text-left">Fine ID</th>
                    <th className="text-left">Amount (RM)</th>
                    <th className="text-left">Student</th>
                    <th className="text-left">Block</th>
                    <th className="text-left">Room</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Issued</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map(it => (
                    <tr key={it.id} className="border-t">
                      <td className="py-2">{it.fine_code || it.title || 'Fine'}</td>
                      <td>{Number(it.amount_rm || 0).toFixed(2)}</td>
                      <td>{it.student?.name}</td>
                      <td>{it.block?.name || '-'}</td>
                      <td>{it.room?.room_number || '-'}</td>
                      <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(it.status)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{humanize(it.status)}</span></td>
                      <td>{formatDateTime(it.issued_at)}</td>
                      <td>
                        <Link href={route('staff.fines.show', it.id)} className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {displayItems.length === 0 && (
                    <tr><td colSpan="8" className="py-3 text-gray-600">{items.length === 0 ? 'No fines found.' : 'No matching fines.'}</td></tr>
                  )}
                </tbody>
              </table>

              {filtered.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filtered.length)} of {filtered.length}</div>
                  <div className="flex items-center gap-1">
                    <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${page === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                    ))}
                    <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(); fd.append('days', '3'); fetch(route('staff.fines.notifyUpcoming'), { method: 'POST', headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '') }, body: fd }).then(() => window.location.reload()); }}>
                  <button type="submit" className="inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-white shadow-sm transition hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300">Notify Upcoming Due (3 days)</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function ResidentSearch({ students, valueId, onSelect, error, label = 'Resident', compact = false }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!valueId) {
      setSelected(null);
      setQuery('');
      return;
    }
    const s = students.find(st => String(st.id) === String(valueId));
    if (s) {
      setSelected(s);
      setQuery(s.name);
    }
  }, [valueId, students]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter(s => s.name?.toLowerCase().includes(q) || String(s.id).includes(q))
      .slice(0, 10);
  }, [debouncedQuery, students]);

  const handleSelect = (s) => {
    setSelected(s);
    setQuery(s.name);
    onSelect?.(s);
    setOpen(false);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery('');
    onSelect?.(null);
    setOpen(true);
  };

  return (
    <div className="relative">
      {label ? (
        <label className="block text-sm font-medium text-violet-800">{label}</label>
      ) : null}
      <div className={`${label ? 'mt-1 ' : ''}relative`}>
        <input
          type="text"
          className={`w-full rounded border border-violet-200 ${compact ? 'p-1.5 text-sm' : 'p-2'} pr-9 focus:border-violet-500 focus:ring-violet-500 ${selected ? 'bg-violet-50' : ''}`}
          placeholder="Search by name or ID..."
          value={query}
          onChange={(e) => { if (selected) setSelected(null); setQuery(e.target.value); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          readOnly={!!selected}
        />
        {(selected || query) && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear"
            title="Clear"
          >
            ×
          </button>
        )}
        {open && !selected && debouncedQuery && (
          <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded border border-violet-200 bg-white shadow">
            {results.length > 0 ? (
              results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(s)}
                    className="block w-full px-3 py-2 text-left hover:bg-violet-50"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">ID {s.id}</div>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-600">No matches</li>
            )}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
