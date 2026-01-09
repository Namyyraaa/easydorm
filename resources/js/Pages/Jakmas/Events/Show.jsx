import React, { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ event }) {
  const { props } = usePage();
  const userId = props?.auth?.user?.id;
  const canEdit = String(event?.created_by) === String(userId);
  const registeredStudents = props.registeredStudents || [];

  // Registrations filters/pagination
  const [statusFilter, setStatusFilter] = useState('all'); // all | attended | absent
  const [pageSize, setPageSize] = useState(20); // 20 | 50 | 100
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [statusFilter, pageSize]);
  const attendedCount = React.useMemo(() => (registeredStudents || []).filter(s => s.status === 'Attended').length, [registeredStudents]);
  const totalCount = registeredStudents.length;
  const filteredStudents = React.useMemo(() => {
    if (statusFilter === 'all') return registeredStudents;
    if (statusFilter === 'attended') return registeredStudents.filter(s => s.status === 'Attended');
    return registeredStudents.filter(s => s.status !== 'Attended');
  }, [registeredStudents, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayStudents = React.useMemo(() => filteredStudents.slice(start, end), [filteredStudents, start, end]);

  const initialTab = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) || 'details';
  const [activeTab, setActiveTab] = useState(initialTab === 'registrations' ? 'registrations' : 'details');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeTab === 'details') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', 'registrations');
    }
    window.history.replaceState({}, '', url);
  }, [activeTab]);

  const fmtLocal = (dt) => {
    if (!dt) return '';
    try {
      const d = new Date(dt);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const [editing, setEditing] = useState(false);
  const eventForm = useForm({
    name: event.name || '',
    description: event.description || '',
    visibility: event.visibility || 'open',
    type: event.type || 'event',
    starts_at: fmtLocal(event.starts_at),
    ends_at: fmtLocal(event.ends_at),
    registration_opens_at: fmtLocal(event.registration_opens_at),
    registration_closes_at: fmtLocal(event.registration_closes_at),
    capacity: event.capacity ?? '',
    dorm_id: event.dorm_id ?? '',
  });

  const resetForm = () => {
    eventForm.setData({
      name: event.name || '',
      description: event.description || '',
      visibility: event.visibility || 'open',
      type: event.type || 'event',
      starts_at: fmtLocal(event.starts_at),
      ends_at: fmtLocal(event.ends_at),
      registration_opens_at: fmtLocal(event.registration_opens_at),
      registration_closes_at: fmtLocal(event.registration_closes_at),
      capacity: event.capacity ?? '',
      dorm_id: event.dorm_id ?? '',
    });
  };

  const save = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    eventForm.patch(route('jakmas.events.update', event.id), {
      onSuccess: () => setEditing(false),
    });
  };

  const passwordForm = useForm({ attendance_password: '' });
  const setPassword = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    passwordForm.post(route('jakmas.events.setPassword', event.id), { preserveScroll: true });
  };

  const mediaForm = useForm({ images: [] });
  const [previews, setPreviews] = useState([]);
  const onImagesChange = (files) => {
    const arr = Array.from(files || []);
    mediaForm.setData('images', arr);
    const urls = arr.filter(f => f.type?.startsWith('image/')).map(f => URL.createObjectURL(f));
    setPreviews(urls);
  };
  const uploadMedia = (e) => {
    e.preventDefault();
    if (!editing || !canEdit) return;
    mediaForm.post(route('jakmas.events.media.upload', event.id), { forceFormData: true, preserveScroll: true, onSuccess: () => { setPreviews([]); mediaForm.reset('images'); } });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{event.type === 'announcement' ? 'Announcement' : 'Event'}: {event.name}</h2>}>
      <Head title="Event Detail" />
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          {canEdit && event.type === 'event' && (
            <div className="border-b border-violet-200 mb-6">
              <nav className="-mb-px flex w-full" aria-label="Tabs">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-1 ${activeTab === 'details' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
                >
                  Event Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('registrations')}
                  className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-2 ${activeTab === 'registrations' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
                >
                  Registered Students
                </button>
              </nav>
            </div>
          )}

          {activeTab === 'details' && (
            <>
              {/* Images first */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Images</h3>
                  {editing && canEdit && (
                    <form onSubmit={uploadMedia} className="flex items-center gap-2">
                      <input id="images" type="file" accept="image/*" multiple className="sr-only" onChange={(e)=>onImagesChange(e.target.files)} />
                      <label htmlFor="images" className="inline-flex items-center h-10 rounded-lg border border-violet-300 bg-white px-3 text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer">Choose files</label>
                      <button type="submit" className="inline-flex items-center h-10 px-3 rounded bg-violet-600 text-white disabled:opacity-50" disabled={mediaForm.processing}>Upload</button>
                    </form>
                  )}
                </div>
                {previews.length > 0 && editing && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {previews.map((src, idx) => (
                      <img key={`p-${idx}`} src={src} alt="preview" className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                  {(event.media || []).map(m => (
                    <div key={m.id} className="relative group">
                      <img src={m.url || (m.path?.startsWith('http') ? m.path : `/storage/${m.path}`)} alt={m.original_name || 'image'} className="w-full h-24 object-cover rounded" />
                      {editing && canEdit && (
                        <Link as="button" method="delete" href={route('jakmas.events.media.remove', { event: event.id, media: m.id })} preserveScroll className="absolute top-1 right-1 hidden group-hover:block text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Details next */}
              <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-semibold">Event Details</h3>
                  <div className="ml-auto flex gap-2">
                    {canEdit && (!editing ? (
                      <button className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white" onClick={() => setEditing(true)}>Edit</button>
                    ) : (
                      <>
                        <button type="button" className="inline-flex items-center px-3 py-1 rounded border" onClick={() => { resetForm(); setEditing(false); }}>Cancel</button>
                        <button type="submit" form="event-edit-form" className="inline-flex items-center px-3 py-1 rounded bg-violet-600 text-white disabled:opacity-50" disabled={eventForm.processing}>Save</button>
                      </>
                    ))}
                  </div>
                </div>

                <form id="event-edit-form" onSubmit={save} className="space-y-4 text-violet-900">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Name</label>
                    <input className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.name} onChange={e=>eventForm.setData('name', e.target.value)} disabled={!editing} />
                    {eventForm.errors.name && <p className="text-sm text-red-600">{eventForm.errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-violet-800">Description</label>
                    {editing ? (
                      <textarea rows={4} className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={eventForm.data.description} onChange={e=>eventForm.setData('description', e.target.value)} />
                    ) : (
                      <div className="mt-1 w-full rounded border border-violet-200 p-2 bg-gray-50 whitespace-pre-wrap text-sm text-gray-700">{event.description || ''}</div>
                    )}
                    {eventForm.errors.description && <p className="text-sm text-red-600">{eventForm.errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-violet-800">Visibility</label>
                      <select className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.visibility} onChange={e=>eventForm.setData('visibility', e.target.value)} disabled={!editing}>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-violet-800">Type</label>
                      <select className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.type} onChange={e=>eventForm.setData('type', e.target.value)} disabled={!editing}>
                        <option value="event">Event</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-violet-800">Starts At</label>
                      <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.starts_at} onChange={e=>eventForm.setData('starts_at', e.target.value)} disabled={!editing} />
                      {eventForm.errors.starts_at && <p className="text-sm text-red-600">{eventForm.errors.starts_at}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-violet-800">Ends At</label>
                      <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.ends_at} onChange={e=>eventForm.setData('ends_at', e.target.value)} disabled={!editing} />
                      {eventForm.errors.ends_at && <p className="text-sm text-red-600">{eventForm.errors.ends_at}</p>}
                    </div>
                  </div>

                  {eventForm.data.type !== 'announcement' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-violet-800">Registration Opens</label>
                        <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={eventForm.data.registration_opens_at} onChange={e=>eventForm.setData('registration_opens_at', e.target.value)} disabled={!editing} />
                        {eventForm.errors.registration_opens_at && <p className="text-sm text-red-600">{eventForm.errors.registration_opens_at}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-violet-800">Registration Closes</label>
                        <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={eventForm.data.registration_closes_at} onChange={e=>eventForm.setData('registration_closes_at', e.target.value)} disabled={!editing} />
                        {eventForm.errors.registration_closes_at && <p className="text-sm text-red-600">{eventForm.errors.registration_closes_at}</p>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-violet-800">Capacity</label>
                      <input type="number" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.capacity} onChange={e=>eventForm.setData('capacity', e.target.value)} disabled={!editing} />
                      {eventForm.errors.capacity && <p className="text-sm text-red-600">{eventForm.errors.capacity}</p>}
                    </div>
                  </div>
                </form>
              </div>

              {eventForm.data.type === 'event' && canEdit && (
                <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
                  <h3 className="font-semibold mb-3">Attendance Password</h3>
                  <form onSubmit={setPassword} className="flex gap-2">
                    <input className="h-10 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500" value={passwordForm.data.attendance_password} onChange={e=>passwordForm.setData('attendance_password', e.target.value)} placeholder={event.attendance_password_hash ? '••••••••' : ''} />
                    <button type="submit" className="inline-flex items-center h-10 px-4 rounded bg-violet-600 text-white disabled:opacity-50" disabled={passwordForm.processing}>Set</button>
                  </form>
                </div>
              )}
            </>
          )}

          {activeTab === 'registrations' && canEdit && event.type === 'event' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold">Registered Students</h3>
                <div className="text-sm text-gray-700">Attended {attendedCount} / Registered {totalCount}</div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Status</label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                    >
                      <option value="all">All</option>
                      <option value="attended">Attended</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="text-sm text-gray-600">Per page</label>
                    <select
                      value={pageSize}
                      onChange={e => setPageSize(parseInt(e.target.value, 10))}
                      className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-gray-600">Showing {filteredStudents.length === 0 ? 0 : start + 1} - {Math.min(end, filteredStudents.length)} of {filteredStudents.length}</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="py-2 text-left">Name</th>
                    <th className="text-left">Dorm</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStudents.map((s, idx) => (
                    <tr key={s.id + '-' + idx} className="border-t">
                      <td className="py-2">{s.name}</td>
                      <td>{s.dorm_code || '-'}</td>
                      <td>
                        <span className={`uppercase text-xs px-2 py-0.5 rounded ${s.status === 'Attended' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan="3" className="py-3 text-gray-600">No registrations.</td></tr>
                  )}
                </tbody>
              </table>
              {filteredStudents.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
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

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
