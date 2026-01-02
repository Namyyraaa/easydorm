import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ event }) {
  const passwordForm = useForm({ attendance_password: '' });
  const mediaForm = useForm({ images: [] });

  const setPassword = (e) => {
    e.preventDefault();
    passwordForm.post(route('staff.events.setPassword', event.id));
  };
  const uploadMedia = (e) => {
    e.preventDefault();
    mediaForm.post(route('staff.events.media.upload', event.id), { forceFormData: true });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Event: {event.name}</h2>}>
      <div className="p-6">
      <p className="mb-4 text-sm text-gray-700">{event.description}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-medium mb-2">Attendance Password</h2>
          <form onSubmit={setPassword} className="flex gap-2">
            <input className="border rounded w-full" value={passwordForm.data.attendance_password} onChange={e=>passwordForm.setData('attendance_password', e.target.value)} />
            <button className="px-3 py-2 bg-blue-600 text-white rounded">Set</button>
          </form>
        </div>
        <div>
          <h2 className="font-medium mb-2">Images</h2>
          <form onSubmit={uploadMedia} className="space-y-2">
            <input type="file" multiple onChange={e=>mediaForm.setData('images', e.target.files)} />
            <button className="px-3 py-2 bg-blue-600 text-white rounded">Upload</button>
          </form>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {(event.media || []).map(m => (
              <img key={m.id} src={m.url || (m.path?.startsWith('http') ? m.path : `/storage/${m.path}`)} alt={m.original_name || 'image'} className="w-full h-24 object-cover rounded" />
            ))}
          </div>
        </div>
      </div>
      </div>
    </AuthenticatedLayout>
  );
}
