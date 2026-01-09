import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ event, isRegistered, isRegistrationOpen }) {
  const regForm = useForm({});
  const revokeForm = useForm({});
  const attForm = useForm({ attendance_password: '' });

  const register = (e) => {
    e.preventDefault();
    regForm.post(route('student.events.register', event.id));
  };
  const revoke = (e) => {
    e.preventDefault();
    revokeForm.post(route('student.events.revoke', event.id));
  };
  const attend = (e) => {
    e.preventDefault();
    attForm.post(route('student.events.attend', event.id));
  };

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

  const getRegisteredCount = () => {
    const regs = event?.registrations;
    if (Array.isArray(regs)) return regs.length;
    const counts = event?.registration_count ?? event?.registrations_count ?? event?.attendees_count;
    if (typeof counts === 'number') return counts;
    return 0;
  };

  const getEventStatus = () => {
    const now = new Date();
    const start = event?.starts_at ? new Date(event.starts_at) : null;
    const end = event?.ends_at ? new Date(event.ends_at) : null;
    if (start && now < start) return 'Upcoming';
    if (start && end && now >= start && now <= end) return 'Ongoing';
    if (end && now > end) return 'Ended';
    return 'Scheduled';
  };

  const badgeClassForEventStatus = (s) => {
    switch (s) {
      case 'Upcoming':
        return 'bg-sky-100 text-sky-800 border border-sky-200';
      case 'Ongoing':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Ended':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getRegistrationStatus = () => {
    const now = new Date();
    const opens = event?.registration_opens_at ? new Date(event.registration_opens_at) : null;
    const closes = event?.registration_closes_at ? new Date(event.registration_closes_at) : null;
    if (opens && now < opens) return 'Reg: Not Open';
    if (opens && closes && now >= opens && now <= closes) return 'Reg: Open';
    return 'Reg: Closed';
  };

  const badgeClassForRegStatus = (s) => {
    switch (s) {
      case 'Reg: Open':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Reg: Not Open':
        return 'bg-sky-100 text-sky-800 border border-sky-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{event.type === 'announcement' ? 'Announcement' : 'Event'}: {event.name}</h2>}>
      <Head title={`${event.type === 'announcement' ? 'Announcement Detail' : 'Event Detail'}`} />
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          {/* Images first */}
          <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Images</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
              {(event.media || []).map(m => (
                <div key={m.id} className="relative group">
                  <img src={m.url || (m.path?.startsWith('http') ? m.path : `/storage/${m.path}`)} alt={m.original_name || 'image'} className="w-full h-24 object-cover rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Details next */}
          <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{event.type === 'announcement' ? 'Announcement Details' : 'Event Details'}</h3>
              <div className="flex items-center gap-3 ml-auto">
                <div className="text-sm text-gray-700">{getRegisteredCount()} / {event.capacity ?? '-'}</div>
              </div>
            </div>

            <div className="space-y-4 text-violet-900">
              <div>
                <label className="block text-sm font-medium text-violet-800">Name</label>
                <input className="mt-1 w-full rounded border border-violet-200 p-2 disabled:bg-gray-100" value={event.name || ''} disabled />
              </div>

              <div>
                <label className="block text-sm font-medium text-violet-800">Description</label>
                <div className="mt-1 w-full rounded border border-violet-200 p-2 text-gray-800 whitespace-pre-wrap">{event.description || ''}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-violet-800">Starts At</label>
                  <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 disabled:bg-gray-100" value={fmtLocal(event.starts_at)} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-violet-800">Ends At</label>
                  <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 disabled:bg-gray-100" value={fmtLocal(event.ends_at)} disabled />
                </div>
              </div>

              {event.type !== 'announcement' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Registration Opens</label>
                    <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 disabled:bg-gray-100" value={fmtLocal(event.registration_opens_at)} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-800">Registration Closes</label>
                    <input type="datetime-local" className="mt-1 w-full rounded border border-violet-200 p-2 disabled:bg-gray-100" value={fmtLocal(event.registration_closes_at)} disabled />
                  </div>
                </div>
              )}
            </div>
          </div>

          {event.type === 'event' && (
            <>
              {/* Registration actions */}
              <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
                <div className="flex items-center">
                  <h3 className="font-semibold">Registration</h3>
                  <div className="ml-auto flex items-center gap-2">
                    {!isRegistered ? (
                      <form onSubmit={register}>
                        <button disabled={!isRegistrationOpen || regForm.processing} className={`inline-flex items-center h-10 px-4 rounded text-white ${isRegistrationOpen ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'} disabled:opacity-50`}>
                          {regForm.processing ? 'Registering…' : 'Register'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={revoke}>
                        <button disabled={!isRegistrationOpen || revokeForm.processing} className={`inline-flex items-center h-10 px-4 rounded text-white ${isRegistrationOpen ? 'bg-red-600' : 'bg-gray-400 cursor-not-allowed'} disabled:opacity-50`}>
                          {revokeForm.processing ? 'Revoking…' : 'Revoke Registration'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                {!isRegistrationOpen && (
                  <p className="mt-2 text-sm text-gray-600">Registration is currently closed.</p>
                )}
              </div>

              {/* Attendance Password */}
              <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
                <h3 className="font-semibold mb-3">Attendance Password</h3>
                {isRegistered ? (
                  <form onSubmit={attend} className="flex gap-2">
                    <input className="h-10 w-full rounded border border-violet-200 p-2" placeholder="Attendance Password" value={attForm.data.attendance_password} onChange={e=>attForm.setData('attendance_password', e.target.value)} />
                    <button className="inline-flex items-center h-10 px-4 rounded bg-violet-600 text-white disabled:opacity-50" disabled={attForm.processing}>Confirm</button>
                  </form>
                ) : (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">Register to unlock attendance.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
