import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';

export default function ResidentsList() {
  const { props } = usePage();
  const residents = props.residents || [];
  const myDorm = props.myDorm || null;
  const [openDetails, setOpenDetails] = useState({}); // { [residentId]: boolean }
  const [revokingId, setRevokingId] = useState(null);

  const displayedResidents = residents;

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Residents</h2>}>
      <Head title="Residents List" />

      <div className="py-12 space-y-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-semibold">Residents List — {myDorm ? `${myDorm.name} (${myDorm.code})` : 'My Dorm'}</h3>
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Dorm</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Details</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayedResidents.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className="border-t align-top">
                      <td className="py-2">{r.student?.name}</td>
                      <td>{r.student?.email}</td>
                      <td>{r.dorm?.name} ({r.dorm?.code})</td>
                      <td>{r.room?.block?.name || '-'}</td>
                      <td>{r.room?.room_number || '-'}</td>
                      <td>{r.check_in_date}</td>
                      <td>{r.check_out_date || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded border border-violet-300 text-violet-700 hover:bg-violet-50"
                          onClick={() => setOpenDetails(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                        >
                          {openDetails[r.id] ? 'Hide' : 'View'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded disabled:opacity-50"
                          disabled={revokingId === r.student_id}
                          onClick={() => {
                            setRevokingId(r.student_id);
                            router.post(route('staff.residents.revoke'), { student_id: r.student_id }, {
                              preserveScroll: true,
                              onFinish: () => setRevokingId(null),
                            });
                          }}
                        >
                          {revokingId === r.student_id ? 'Checking out...' : 'Check out'}
                        </button>
                      </td>
                    </tr>
                    {openDetails[r.id] && (
                      <tr className="bg-violet-50">
                        <td colSpan="9" className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-semibold text-violet-800 mb-1">Student</div>
                              <div><span className="text-gray-600">Name:</span> {r.student?.name || '-'}</div>
                              <div><span className="text-gray-600">Email:</span> {r.student?.email || '-'}</div>
                              <div><span className="text-gray-600">Gender:</span> {r.student?.gender || '-'}</div>
                              <div><span className="text-gray-600">Phone:</span> {r.student?.phone || r.student?.profile?.phone || '-'}</div>
                              <div><span className="text-gray-600">Faculty:</span> {r.student?.faculty?.name || r.student?.faculty_name || '-'}</div>
                              {Array.isArray(r.student?.hobbies) && r.student.hobbies.length > 0 && (
                                <div><span className="text-gray-600">Hobbies:</span> {r.student.hobbies.join(', ')}</div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-violet-800 mb-1">Assignment</div>
                              <div><span className="text-gray-600">Dorm:</span> {r.dorm?.name || '-'} {r.dorm?.code ? `(${r.dorm.code})` : ''}</div>
                              <div><span className="text-gray-600">Block:</span> {r.room?.block?.name || '-'}</div>
                              <div><span className="text-gray-600">Room:</span> {r.room?.room_number || '-'}</div>
                              <div><span className="text-gray-600">Room Gender:</span> {r.room?.gender || '-'}</div>
                              <div><span className="text-gray-600">Capacity:</span> {typeof r.room?.capacity !== 'undefined' ? r.room.capacity : '-'}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-violet-800 mb-1">Dates</div>
                              <div><span className="text-gray-600">Check-in:</span> {r.check_in_date || '-'}</div>
                              <div><span className="text-gray-600">Check-out:</span> {r.check_out_date || '-'}</div>
                              <div><span className="text-gray-600">Created:</span> {r.created_at || '-'}</div>
                              <div><span className="text-gray-600">Updated:</span> {r.updated_at || '-'}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {displayedResidents.length === 0 && (
                  <tr><td colSpan="9" className="py-2 text-gray-500">No residents yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
