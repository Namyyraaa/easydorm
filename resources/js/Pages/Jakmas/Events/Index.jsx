import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ events }) {
  const { props } = usePage();
  const userId = props?.auth?.user?.id;
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">JAKMAS Events</h2>}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-medium">Manage Events</h1>
          <Link href={route('jakmas.events.create')} className="px-3 py-2 bg-blue-600 text-white rounded">Create Event</Link>
        </div>
        <div className="space-y-3">
          {(events?.data || []).map(ev => (
            <div key={ev.id} className="border rounded p-3">
              <div className="flex justify-between">
                <div>
                  <h2 className="font-medium">{ev.name}</h2>
                  <p className="text-sm text-gray-600">{ev.visibility} · {ev.type}</p>
                  <p className="text-sm">{new Date(ev.starts_at).toLocaleString()} - {new Date(ev.ends_at).toLocaleString()}</p>
                </div>
                <div>
                  {String(ev.created_by) === String(userId) ? (
                    <Link href={route('jakmas.events.show', ev.id)} className="text-blue-600">Manage</Link>
                  ) : (
                    <button className="text-gray-400 cursor-not-allowed" disabled>Manage</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
