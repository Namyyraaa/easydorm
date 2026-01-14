import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useEffect, useMemo, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';

export default function ResidentsList() {
  const { props } = usePage();
  const residents = props.residents || [];
  const myDorm = props.myDorm || null;
  const [openDetails, setOpenDetails] = useState({}); // { [residentId]: boolean }
  const [revokingId, setRevokingId] = useState(null);

  const [blockFilter, setBlockFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const blocks = useMemo(() => {
    const b = new Set(residents.map(r => r?.room?.block?.name).filter(Boolean));
    return ['all', ...Array.from(b)];
  }, [residents]);

  const rooms = useMemo(() => {
    const source = blockFilter === 'all'
      ? residents
      : residents.filter(r => r?.room?.block?.name === blockFilter);
    const set = new Set(source.map(r => r?.room?.room_number).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [residents, blockFilter]);

  const filteredResidents = useMemo(() => {
    return residents.filter(r => (
      (blockFilter === 'all' || r?.room?.block?.name === blockFilter) &&
      (roomFilter === 'all' || r?.room?.room_number === roomFilter)
    ));
  }, [residents, blockFilter, roomFilter]);

  useEffect(() => { setPage(1); }, [blockFilter, roomFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredResidents.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayedResidents = useMemo(() => filteredResidents.slice(start, end), [filteredResidents, start, end]);

  const toDDMMYYYY = (d) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (!Number.isNaN(dt.getTime())) {
        const day = String(dt.getDate()).padStart(2, '0');
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const year = dt.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (_) {}
    if (typeof d === 'string') {
      const s = d.slice(0, 10);
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    }
    return '-';
  };

  const cap = (s) => {
    if (!s) return '-';
    try {
      const str = String(s);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (_) {
      return '-';
    }
  };
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Residents</h2>}>
      <Head title="Residents List" />

      <div className="py-12 space-y-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-semibold">Residents List — {myDorm ? `${myDorm.name}` : 'My Dorm'}</h3>
              <button
                type="button"
                onClick={() => { setBlockFilter('all'); setRoomFilter('all'); setPage(1); }}
                className="text-sm text-gray-600 hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <label className="text-sm text-gray-600">Block</label>
                <select
                  value={blockFilter}
                  onChange={e => setBlockFilter(e.target.value)}
                  className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                >
                  {blocks.map(b => (
                    <option key={b} value={b}>{b === 'all' ? 'All' : b}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label className="text-sm text-gray-600">Room</label>
                <select
                  value={roomFilter}
                  onChange={e => setRoomFilter(e.target.value)}
                  className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                >
                  {rooms.map(rm => (
                    <option key={rm} value={rm}>{rm === 'all' ? 'All' : rm}</option>
                  ))}
                </select>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2">Name</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayedResidents.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className="border-t">
                      <td className="py-2">{r.student?.name}</td>
                      <td className="py-2">{r.room?.block?.name || '-'}</td>
                      <td className="py-2">{r.room?.room_number || '-'}</td>
                      <td className="py-2">{toDDMMYYYY(r.check_in_date)}</td>
                      <td className="py-2">{toDDMMYYYY(r.check_out_date)}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                          onClick={() => setOpenDetails(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                        >
                          {openDetails[r.id] ? 'Hide' : 'View'}
                        </button>
                      </td>
                      <td className="py-2">
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
                        <td colSpan="7" className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-semibold text-violet-800 mb-1">Student</div>
                              <div><span className="text-gray-600">Name:</span> {r.student?.name || '-'}</div>
                              <div><span className="text-gray-600">Email:</span> {r.student?.email || '-'}</div>
                              <div><span className="text-gray-600">Gender:</span> {cap(r.student?.profile?.gender)}</div>
                              <div><span className="text-gray-600">Faculty:</span> {r.student?.profile?.faculty?.code || '-'}</div>
                              {Array.isArray(r.student?.hobbies) && r.student.hobbies.length > 0 && (
                                <div><span className="text-gray-600">Hobbies:</span> {r.student.hobbies.join(', ')}</div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-violet-800 mb-1">Assignment</div>
                              <div><span className="text-gray-600">Dorm:</span> {r.dorm?.name || '-'} {r.dorm?.code ? `(${String(r.dorm.code).toUpperCase()})` : ''}</div>
                              <div><span className="text-gray-600">Block:</span> {r.room?.block?.name || '-'}</div>
                              <div><span className="text-gray-600">Room:</span> {r.room?.room_number || '-'}</div>
                              <div><span className="text-gray-600">Room Gender:</span> {cap(r.room?.block?.gender || '-')}</div>
                              <div><span className="text-gray-600">Capacity:</span> {typeof r.room?.capacity !== 'undefined' ? r.room.capacity : '-'}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-violet-800 mb-1">Dates</div>
                              <div><span className="text-gray-600">Check-in:</span> {toDDMMYYYY(r.check_in_date) || '-'}</div>
                              <div><span className="text-gray-600">Check-out:</span> {toDDMMYYYY(r.check_out_date) || '-'}</div>
                              <div><span className="text-gray-600">Created:</span> {toDDMMYYYY(r.created_at) || '-'}</div>
                              <div><span className="text-gray-600">Updated:</span> {toDDMMYYYY(r.updated_at) || '-'}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {displayedResidents.length === 0 && (
                  <tr><td colSpan="7" className="py-2 text-gray-500">{residents.length === 0 ? 'No residents yet' : 'No matching residents'}</td></tr>
                )}
              </tbody>
            </table>

            {filteredResidents.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filteredResidents.length)} of {filteredResidents.length}</div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-2 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`px-2 py-1 rounded border text-sm ${page === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-2 py-1 rounded border text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
