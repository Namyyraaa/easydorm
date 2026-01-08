import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function StaffEventsIndex() {
  const { props } = usePage();
  const raw = props.events || [];
  const items = Array.isArray(raw) ? raw : (raw?.data || []);
  const flash = props.flash || {};
  const userId = props?.auth?.user?.id;
  const staffDorm = props?.staffDorm;
  const staffDormId = staffDorm?.id ?? staffDorm?.dorm_id ?? props?.staffDormId ?? props?.staff_dorm_id ?? '';
  const initialTab = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) || 'manage';
  const [activeTab, setActiveTab] = useState(initialTab === 'create' ? 'create' : 'manage');

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const humanize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const badgeClassFor = (s) => {
    switch (s) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Derive filters from events table fields: visibility and dorm
  const statuses = useMemo(() => {
    const s = new Set(items.map(e => e.visibility).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [items]);

  const types = useMemo(() => {
    const t = new Set(items.map(e => e.type).filter(Boolean));
    return ['all', ...Array.from(t)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(e => (
      (statusFilter === 'all' || e.visibility === statusFilter)
      && (typeFilter === 'all' || e.type === typeFilter)
    ));
  }, [items, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  // Persist active tab to URL so back/refresh keeps the same tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeTab === 'manage') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', 'create');
    }
    window.history.replaceState({}, '', url);
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = useMemo(() => filtered.slice(start, end), [filtered, start, end]);
  
  // Create Event form state and handlers (embedded form)
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    visibility: 'open',
    type: 'event',
    starts_at: '',
    ends_at: '',
    registration_opens_at: '',
    registration_closes_at: '',
    capacity: '',
    dorm_id: '',
    images: [],
  });

  const [previews, setPreviews] = useState([]);

  const onImagesChange = (files) => {
    const arr = Array.from(files || []);
    setData('images', arr);
    const urls = arr.filter(f => f.type?.startsWith('image/')).map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    post(route('staff.events.store'), { forceFormData: true, preserveScroll: true });
  };

  // Auto-select dorm_id when visibility is closed
  useEffect(() => {
    if (data.visibility === 'closed') {
      if (staffDormId) setData('dorm_id', staffDormId);
    } else {
      setData('dorm_id', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.visibility, staffDormId]);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dorm Events</h2>}>
      <Head title="Events" />
      <div className="py-12 space-y-6">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>{flash.error || flash.success}</div>
        )}
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <div className="border-b border-violet-200 mb-6">
            <nav className="-mb-px flex w-full" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-2 ${activeTab === 'create' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Create Event
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-1 ${activeTab === 'manage' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Manage Events
              </button>
            </nav>
          </div>

          {activeTab === 'manage' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="font-semibold mb-3">Events</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-3">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Visibility</label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s === 'all' ? 'All' : humanize(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Type</label>
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                      className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                    >
                      {types.map(t => (
                        <option key={t} value={t}>{t === 'all' ? 'All' : humanize(t)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="py-2 text-left">Title</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Capacity</th>
                    <th className="text-left">Starts</th>
                    <th className="text-left">Visibility</th>
                    <th className="text-left">Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map(e => (
                    <tr key={e.id} className="border-t">
                      <td className="py-2">{e.name}</td>
                      <td>{e.type}</td>
                      <td>{e.capacity != null ? e.capacity : 'N/A'}</td>
                      <td>{e.starts_at ? new Date(e.starts_at).toLocaleString() : '-'}</td>
                      <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(e.visibility)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{(e.visibility || '').replace(/_/g, ' ')}</span></td>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleString() : ''}</td>
                      <td>
                        {String(e.created_by) === String(userId) ? (
                          <Link href={route('staff.events.show', e.id)} className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1">
                            Manage
                          </Link>
                        ) : (
                          <button className="inline-flex items-center px-3 py-1 rounded bg-gray-200 text-gray-500 cursor-not-allowed" disabled>
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {displayItems.length === 0 && (
                    <tr><td colSpan="7" className="py-3 text-gray-600">{items.length === 0 ? 'No events yet.' : 'No matching events.'}</td></tr>
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
            </div>
          )}

          {activeTab === 'create' && (
            <div className="overflow-hidden rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
              <h3 className="font-semibold mb-3 text-violet-900">Create Event</h3>
              <form onSubmit={submitCreate} className="space-y-4 text-violet-900">
                {Object.keys(errors).length > 0 && (
                  <div className="p-3 rounded bg-red-50 text-red-700 text-sm">Please fix the highlighted fields below.</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-violet-800">Name</label>
                  <input className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.name} onChange={e=>setData('name', e.target.value)} />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-800">Description</label>
                  <textarea className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" rows={4} value={data.description} onChange={e=>setData('description', e.target.value)} />
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Visibility</label>
                    <select className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.visibility} onChange={e=>setData('visibility', e.target.value)}>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                    {errors.visibility && <p className="text-sm text-red-600">{errors.visibility}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Type</label>
                    <select className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.type} onChange={e=>setData('type', e.target.value)}>
                      <option value="event">Event</option>
                      <option value="announcement">Announcement</option>
                    </select>
                    {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Starts At</label>
                    <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.starts_at} onChange={e=>setData('starts_at', e.target.value)} />
                    {errors.starts_at && <p className="text-sm text-red-600">{errors.starts_at}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Ends At</label>
                    <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.ends_at} onChange={e=>setData('ends_at', e.target.value)} />
                    {errors.ends_at && <p className="text-sm text-red-600">{errors.ends_at}</p>}
                  </div>
                </div>

                {data.type !== 'announcement' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-violet-800">Registration Opens</label>
                      <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.registration_opens_at} onChange={e=>setData('registration_opens_at', e.target.value)} />
                      {errors.registration_opens_at && <p className="text-sm text-red-600">{errors.registration_opens_at}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-violet-800">Registration Closes</label>
                      <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.registration_closes_at} onChange={e=>setData('registration_closes_at', e.target.value)} />
                      {errors.registration_closes_at && <p className="text-sm text-red-600">{errors.registration_closes_at}</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Capacity</label>
                    <input type="number" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={data.capacity} onChange={e=>setData('capacity', e.target.value)} />
                    {errors.capacity && <p className="text-sm text-red-600">{errors.capacity}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-800">Images</label>
                  <input id="images" type="file" accept="image/*,application/pdf" multiple className="sr-only" onChange={e=>onImagesChange(e.target.files)} />
                  <label htmlFor="images" className="mt-1 inline-flex items-center rounded-lg border border-violet-300 bg-white px-4 py-2 text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer">Choose files</label>
                  <p className="mt-1 text-xs text-gray-500">You can select multiple images or PDFs (max 10).</p>
                  {errors['images.*'] && <p className="text-sm text-red-600">{errors['images.*']}</p>}
                  {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {previews.map((src, idx) => (
                        <img src={src} key={idx} alt="preview" className="w-full h-24 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Link href={route('staff.events.index')} className="inline-flex items-center rounded-lg bg-gray-200 px-4 py-2 text-gray-800 shadow-sm transition hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</Link>
                  <button type="submit" disabled={processing} className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400">Save Event</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
