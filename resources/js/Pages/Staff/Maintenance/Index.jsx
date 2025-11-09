import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

export default function StaffMaintenanceIndex() {
  const { props } = usePage();
  const items = props.requests || [];
  const flash = props.flash || {};

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dorm Maintenance Requests</h2>}>
      <Head title="Maintenance" />
      <div className="py-12 space-y-6">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>{flash.error || flash.success}</div>
        )}
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
          <h3 className="font-semibold mb-3">Requests</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600">
                <th className="py-2 text-left">Title</th>
                <th className="text-left">Student</th>
                <th className="text-left">Block</th>
                <th className="text-left">Room</th>
                <th className="text-left">Status</th>
                <th className="text-left">Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.title}</td>
                  <td>{r.student?.name}</td>
                  <td>{r.block?.name || '-'}</td>
                  <td>{r.room?.room_number || '-'}</td>
                  <td><span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{r.status}</span></td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
                  <td><Link href={route('staff.maintenance.show', r.id)} className="text-indigo-600 hover:underline">View</Link></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="7" className="py-3 text-gray-600">No requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
