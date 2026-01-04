import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ events, announcements }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Announcements & Events</h2>}>
      <div className="p-6 space-y-8">
        <section>
          <h3 className="text-lg font-semibold mb-3">Announcements</h3>
          <div className="space-y-3">
            {(announcements?.data || []).length === 0 && (
              <p className="text-sm text-gray-600">No announcements right now.</p>
            )}
            {(announcements?.data || []).map(an => (
              <div key={an.id} className="border rounded p-3">
                <div className="flex justify-between">
                  <div>
                    <h2 className="font-medium">{an.name}</h2>
                    <p className="text-sm text-gray-600">{an.visibility} · {an.type}</p>
                    <p className="text-sm">{new Date(an.starts_at).toLocaleString()} - {new Date(an.ends_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Link href={route('student.events.show', an.id)} className="text-blue-600">View</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">Events</h3>
          <div className="space-y-3">
            {(events?.data || []).length === 0 && (
              <p className="text-sm text-gray-600">No upcoming events yet.</p>
            )}
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
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
