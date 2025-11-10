import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

export default function StaffComplaintsIndex() {
  const { props } = usePage();
  const items = props.items || [];

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Complaints</h2>}>
      <Head title="Complaints" />
      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Dorm Complaints</h3>
            <div className="divide-y">
              {items.map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-gray-600">{new Date(it.created_at).toLocaleString()} — <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{it.status}</span></div>
                    <div className="text-xs text-gray-500">{it.managed_by_staff_id ? 'Claimed' : 'Unclaimed'}</div>
                  </div>
                  <Link href={route('staff.complaints.show', it.id)} className="text-indigo-600 hover:underline">View</Link>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-gray-600">No complaints found.</p>}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
