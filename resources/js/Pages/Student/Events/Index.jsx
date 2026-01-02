import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ events }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Upcoming Events</h2>}>
      <div className="p-6">
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
                  <Link href={route('student.events.show', ev.id)} className="text-blue-600">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
