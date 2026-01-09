import React, { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ event }) {
  const { props } = usePage();
  const flash = props.flash || {};
  const userId = props?.auth?.user?.id;
  const canEdit = String(event?.created_by) === String(userId);

  const [editing, setEditing] = useState(false);

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
    eventForm.patch(route('staff.events.update', event.id), {
      onSuccess: () => setEditing(false),
    });
  };

  const passwordForm = useForm({ attendance_password: '' });
  const setPassword = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    passwordForm.post(route('staff.events.setPassword', event.id), { preserveScroll: true });
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
    mediaForm.post(route('staff.events.media.upload', event.id), { forceFormData: true, preserveScroll: true, onSuccess: () => { setPreviews([]); mediaForm.reset('images'); } });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{event.type === 'announcement' ? 'Announcement' : 'Event'}: {event.name}</h2>}>
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          {(flash.success || flash.error) && (
            <div className={`mb-4 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>{flash.error || flash.success}</div>
          )}
          {/* Images first */}
          <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Images</h3>
              {editing && (
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
                  {editing && (
                    <Link as="button" method="delete" href={route('staff.events.media.remove', { event: event.id, media: m.id })} preserveScroll className="absolute top-1 right-1 hidden group-hover:block text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</Link>
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
                    <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.registration_opens_at} onChange={e=>eventForm.setData('registration_opens_at', e.target.value)} disabled={!editing} />
                    {eventForm.errors.registration_opens_at && <p className="text-sm text-red-600">{eventForm.errors.registration_opens_at}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Registration Closes</label>
                    <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 focus:border-violet-500 focus:ring-violet-500 disabled:bg-gray-100" value={eventForm.data.registration_closes_at} onChange={e=>eventForm.setData('registration_closes_at', e.target.value)} disabled={!editing} />
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

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
