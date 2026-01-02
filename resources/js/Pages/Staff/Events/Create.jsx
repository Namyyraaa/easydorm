import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create() {
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

  const submit = (e) => {
    e.preventDefault();
    post(route('staff.events.store'), { forceFormData: true });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Create Event</h2>}>
      <div className="p-6 max-w-2xl">
      
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border rounded w-full" value={data.name} onChange={e=>setData('name', e.target.value)} />
          {errors.name && <div className="text-red-600 text-sm">{errors.name}</div>}
        </div>
        <div>
          <label className="block text-sm">Description</label>
          <textarea className="border rounded w-full" value={data.description} onChange={e=>setData('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Visibility</label>
            <select className="border rounded w-full" value={data.visibility} onChange={e=>setData('visibility', e.target.value)}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Type</label>
            <select className="border rounded w-full" value={data.type} onChange={e=>setData('type', e.target.value)}>
              <option value="event">Event</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Starts At</label>
            <input type="datetime-local" className="border rounded w-full" value={data.starts_at} onChange={e=>setData('starts_at', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Ends At</label>
            <input type="datetime-local" className="border rounded w-full" value={data.ends_at} onChange={e=>setData('ends_at', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Registration Opens</label>
            <input type="datetime-local" className="border rounded w-full" value={data.registration_opens_at} onChange={e=>setData('registration_opens_at', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Registration Closes</label>
            <input type="datetime-local" className="border rounded w-full" value={data.registration_closes_at} onChange={e=>setData('registration_closes_at', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Capacity</label>
            <input type="number" className="border rounded w-full" value={data.capacity} onChange={e=>setData('capacity', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Dorm ID (for closed)</label>
            <input type="number" className="border rounded w-full" value={data.dorm_id} onChange={e=>setData('dorm_id', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm">Images</label>
          <input type="file" multiple onChange={e=>setData('images', e.target.files)} />
        </div>
        <div className="flex gap-2">
          <button disabled={processing} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
          <Link href={route('staff.events.index')} className="px-3 py-2 bg-gray-200 rounded">Cancel</Link>
        </div>
      </form>
      </div>
    </AuthenticatedLayout>
  );
}
