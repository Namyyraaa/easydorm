import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';

export default function Residents() {
  const { props } = usePage();
  const students = props.students || [];
  const residents = props.residents || [];
  const myDorm = props.myDorm || null;
  const rooms = props.rooms || [];
  const flash = props.flash || {};

  const assignForm = useForm({ student_id: '', room_id: '', check_in_date: '', check_out_date: ''});
  const bulkForm = useForm({ student_ids: [], room_id: '', check_in_date: '', check_out_date: ''});
  const [revokingId, setRevokingId] = useState(null);
  const [suggestForId, setSuggestForId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Derive selected student and gender for single assignment
  const selectedStudent = useMemo(() => students.find(s => String(s.id) === String(assignForm.data.student_id)), [students, assignForm.data.student_id]);
  const selectedGender = selectedStudent?.gender || null;
  const filteredRoomsSingle = useMemo(() => {
    if (!selectedGender) return rooms; // no filter if gender unknown
    return rooms.filter(r => !r.gender || r.gender === 'unisex' || r.gender === selectedGender);
  }, [rooms, selectedGender]);
  useEffect(() => {
    if (assignForm.data.room_id && !filteredRoomsSingle.some(r => String(r.id) === String(assignForm.data.room_id))) {
      assignForm.setData('room_id', '');
    }
  }, [filteredRoomsSingle, assignForm.data.room_id]);

  // Bulk: first selected student's gender locks the group
  const firstSelectedId = bulkForm.data.student_ids[0] || null;
  const bulkGender = useMemo(() => {
    const s = students.find(x => String(x.id) === String(firstSelectedId));
    return s?.gender || null;
  }, [students, firstSelectedId]);
  const filteredRoomsBulk = useMemo(() => {
    if (!bulkGender) return rooms;
    return rooms.filter(r => !r.gender || r.gender === 'unisex' || r.gender === bulkGender);
  }, [rooms, bulkGender]);
  useEffect(() => {
    if (bulkForm.data.room_id && !filteredRoomsBulk.some(r => String(r.id) === String(bulkForm.data.room_id))) {
      bulkForm.setData('room_id', '');
    }
  }, [filteredRoomsBulk, bulkForm.data.room_id]);

  const fetchSuggestions = async (studentId) => {
    if (!studentId) { setSuggestions([]); setSuggestForId(null); return; }
    setLoadingSuggestions(true);
    setSuggestForId(studentId);
    try {
      const url = route('staff.residents.suggestions', { student_id: studentId });
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      setSuggestions(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Residents</h2>}
    >
      <Head title="Residents" />
      <div className="py-12 space-y-8">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-7xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold mb-4">Assign Resident (Single){myDorm ? ` — ${myDorm.name} (${myDorm.code})` : ''}</h3>
            <form onSubmit={(e) => { e.preventDefault(); assignForm.post(route('staff.residents.assign')); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Student</label>
                <select className="mt-1 w-full border rounded p-2" value={assignForm.data.student_id} onChange={(e) => assignForm.setData('student_id', e.target.value)}>
                  <option value="">Select student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                </select>
                {assignForm.errors.student_id && <p className="text-sm text-red-600">{assignForm.errors.student_id}</p>}
              </div>
              {/* Dorm is auto-selected from your staff assignment */}
              <div>
                <label className="block text-sm font-medium">Room (availability)</label>
                <select className="mt-1 w-full border rounded p-2" value={assignForm.data.room_id} onChange={(e) => assignForm.setData('room_id', e.target.value)}>
                  <option value="">Select room</option>
                  {filteredRoomsSingle.map(r => (
                    <option key={r.id} value={r.id} disabled={r.available <= 0}>
                      {`${r.block} — ${r.room_number} | ${r.gender} | ${r.available}/${r.capacity} free`}
                    </option>
                  ))}
                </select>
                {selectedStudent && !selectedGender && (
                  <p className="text-sm text-amber-700 mt-1">Selected student has no gender set. Please update their profile first.</p>
                )}
                {assignForm.errors.room_id && <p className="text-sm text-red-600">{assignForm.errors.room_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Check-in Date</label>
                  <input type="date" className="mt-1 w-full border rounded p-2" value={assignForm.data.check_in_date} onChange={(e) => assignForm.setData('check_in_date', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Check-out Date</label>
                  <input type="date" className="mt-1 w-full border rounded p-2" value={assignForm.data.check_out_date} onChange={(e) => assignForm.setData('check_out_date', e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={assignForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Assign</button>
            </form>
          </div>
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold mb-4">Assign Residents (Bulk){myDorm ? ` — ${myDorm.name} (${myDorm.code})` : ''}</h3>
            <form onSubmit={(e) => { e.preventDefault(); bulkForm.post(route('staff.residents.assignBulk')); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Students</label>
                <div className="max-h-56 overflow-auto border rounded p-2 space-y-1">
                  {students.map(s => (
                    <div key={s.id} className="flex items-center gap-2 justify-between">
                      <label className="flex items-center gap-2">
                        <input
                        type="checkbox"
                        checked={bulkForm.data.student_ids.includes(s.id)}
                        disabled={
                          // If bulk gender chosen, disable different genders
                          (bulkGender && s.gender && s.gender !== bulkGender) ||
                          // Prevent selecting students without gender once we have a bulk gender
                          (bulkGender && !s.gender)
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          // Enforce bulk gender consistency in UI
                          if (checked) {
                            if (!bulkGender && s.gender) {
                              bulkForm.setData('student_ids', [...bulkForm.data.student_ids, s.id]);
                            } else if (bulkGender && s.gender === bulkGender) {
                              bulkForm.setData('student_ids', [...bulkForm.data.student_ids, s.id]);
                            }
                            // ignore if gender missing or mismatch
                          } else {
                            bulkForm.setData('student_ids', bulkForm.data.student_ids.filter(id => id !== s.id));
                          }
                        }}
                        />
                        <span>
                          {s.name} ({s.email}){s.gender ? ` — ${s.gender}` : ' — gender not set'}
                        </span>
                      </label>
                      <button type="button" className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                        onClick={() => fetchSuggestions(s.id)}>
                        Suggest
                      </button>
                    </div>
                  ))}
                </div>
                {bulkForm.errors.student_ids && <p className="text-sm text-red-600">{bulkForm.errors.student_ids}</p>}
                {bulkGender && (
                  <p className="text-xs text-gray-600 mt-1">Bulk gender locked to: <span className="font-medium">{bulkGender}</span>. Only matching students can be selected.</p>
                )}
              </div>
              {/* Dorm is auto-selected from your staff assignment */}
              <div>
                <label className="block text-sm font-medium">Room (availability)</label>
                <select className="mt-1 w-full border rounded p-2" value={bulkForm.data.room_id} onChange={(e) => bulkForm.setData('room_id', e.target.value)}>
                  <option value="">Select room</option>
                  {filteredRoomsBulk.map(r => (
                    <option key={r.id} value={r.id} disabled={r.available <= 0}>
                      {`${r.block} — ${r.room_number} | ${r.gender} | ${r.available}/${r.capacity} free`}
                    </option>
                  ))}
                </select>
                {bulkGender === null && bulkForm.data.student_ids.length > 0 && (
                  <p className="text-sm text-amber-700 mt-1">First selected student has no gender set. Please update profile.</p>
                )}
                {bulkForm.errors.room_id && <p className="text-sm text-red-600">{bulkForm.errors.room_id}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Check-in Date</label>
                  <input type="date" className="mt-1 w-full border rounded p-2" value={bulkForm.data.check_in_date} onChange={(e) => bulkForm.setData('check_in_date', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Check-out Date</label>
                  <input type="date" className="mt-1 w-full border rounded p-2" value={bulkForm.data.check_out_date} onChange={(e) => bulkForm.setData('check_out_date', e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={bulkForm.processing || bulkForm.data.student_ids.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded">Assign Selected</button>
            </form>
          </div>
        </div>

        {/* Suggestions Panel */}
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Potential Roommates {suggestForId ? `for ${students.find(x => x.id === suggestForId)?.name || ''}` : ''}</h3>
            {!suggestForId && (
              <p className="text-sm text-gray-600">Click "Suggest" next to a student to see potential roommates based on hobby, faculty, gender, interaction style, or daily schedule.</p>
            )}
            {suggestForId && (
              <div>
                {loadingSuggestions ? (
                  <p className="text-sm text-gray-600">Loading suggestions...</p>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map(item => (
                      <div key={item.id} className="flex items-center justify-between border rounded p-2">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-600">{item.email}</div>
                          {Array.isArray(item.matches) && item.matches.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.matches.map((m, idx) => (
                                <span key={idx} className="text-[10px] uppercase px-2 py-0.5 bg-gray-100 rounded">{m.replace('_',' ')}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" className="text-xs px-2 py-1 bg-indigo-600 text-white rounded"
                          onClick={() => {
                            // Respect bulk gender selection rule
                            const cand = students.find(s => String(s.id) === String(item.id));
                            if (!cand) return;
                            if (!bulkGender || (cand.gender && cand.gender === bulkGender)) {
                              if (!bulkForm.data.student_ids.includes(cand.id)) {
                                bulkForm.setData('student_ids', [...bulkForm.data.student_ids, cand.id]);
                              }
                            }
                          }}
                        >Add</button>
                      </div>
                    ))}
                    {suggestions.length === 0 && (
                      <p className="text-sm text-gray-600">No matching students found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold mb-4">Current Residents</h3>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {residents.map(r => (
                  <tr key={r.id} className="border-t">
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
                ))}
                {residents.length === 0 && (
                  <tr><td colSpan="8" className="py-2 text-gray-500">No residents yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}