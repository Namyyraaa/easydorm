import React from 'react';
import { useForm } from '@inertiajs/react';
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

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Event: {event.name}</h2>}>
      <div className="p-6 max-w-3xl">
      <p className="mb-4 text-sm text-gray-700">{event.description}</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(event.media || []).map(m => (
          <img key={m.id} src={m.url || (m.path?.startsWith('http') ? m.path : `/storage/${m.path}`)} alt={m.original_name || 'image'} className="w-full h-24 object-cover rounded" />
        ))}
      </div>
      {event.type === 'announcement' ? (
        <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">This is an announcement. No registration or attendance is required.</div>
      ) : (
        <>
          {!isRegistered ? (
            <form onSubmit={register} className="mb-4">
              <button disabled={!isRegistrationOpen} className={`px-3 py-2 rounded text-white ${isRegistrationOpen ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}>Register</button>
            </form>
          ) : (
            <form onSubmit={revoke} className="mb-4">
              <button disabled={!isRegistrationOpen} className={`px-3 py-2 rounded text-white ${isRegistrationOpen ? 'bg-red-600' : 'bg-gray-400 cursor-not-allowed'}`}>Revoke Registration</button>
            </form>
          )}

          {isRegistered ? (
            <form onSubmit={attend} className="flex gap-2">
              <input className="border rounded w-full" placeholder="Attendance Password" value={attForm.data.attendance_password} onChange={e=>attForm.setData('attendance_password', e.target.value)} />
              <button className="px-3 py-2 bg-blue-600 text-white rounded">Confirm Attendance</button>
            </form>
          ) : (
            <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">Register to unlock attendance.</div>
          )}
        </>
      )}
      </div>
    </AuthenticatedLayout>
  );
}
