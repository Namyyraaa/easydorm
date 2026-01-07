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
  const [activeTab, setActiveTab] = useState('single');
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);

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

  // NEW: Block/Room grid state (Single & Bulk)
  const [singleView, setSingleView] = useState('blocks'); // 'blocks' | 'rooms'
  const [singleBlock, setSingleBlock] = useState(null);
  const [bulkView, setBulkView] = useState('blocks'); // 'blocks' | 'rooms'
  const [bulkBlock, setBulkBlock] = useState(null);

  // Derive block list
  const allBlocks = useMemo(() => {
    const set = new Set((rooms || []).map(r => r.block).filter(Boolean));
    return Array.from(set);
  }, [rooms]);

  // Enabled blocks based on gender-filtered rooms
  const enabledBlocksSingle = useMemo(() => {
    const set = new Set((filteredRoomsSingle || []).map(r => r.block).filter(Boolean));
    return set;
  }, [filteredRoomsSingle]);
  const enabledBlocksBulk = useMemo(() => {
    const set = new Set((filteredRoomsBulk || []).map(r => r.block).filter(Boolean));
    return set;
  }, [filteredRoomsBulk]);

  // Reset selection when gender context changes
  useEffect(() => {
    setSingleView('blocks');
    setSingleBlock(null);
    if (assignForm.data.room_id) assignForm.setData('room_id', '');
  }, [selectedGender]);
  useEffect(() => {
    setBulkView('blocks');
    setBulkBlock(null);
    if (bulkForm.data.room_id) bulkForm.setData('room_id', '');
  }, [bulkGender]);

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

        {/* Tabbed Assignment Forms */}
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="border-b border-violet-200 mb-6">
            <nav className="-mb-px flex w-full" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-1 ${activeTab === 'single' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Assign Resident (Single){myDorm ? ` — ${myDorm.name} (${myDorm.code})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bulk')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-2 ${activeTab === 'bulk' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Assign Residents (Bulk){myDorm ? ` — ${myDorm.name} (${myDorm.code})` : ''}
              </button>
            </nav>
          </div>

          {activeTab === 'single' && (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
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
                  {/* Blocks/Rooms grid for Single */}
                  {singleView === 'blocks' && (
                    <div className="mt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {allBlocks.map((b) => {
                          const enabled = !!selectedGender && enabledBlocksSingle.has(b);
                          return (
                            <button
                              key={b}
                              type="button"
                              className={`rounded border p-3 text-sm text-center transition ${enabled ? 'bg-white hover:ring-2 hover:ring-violet-300' : 'bg-gray-50 opacity-50 cursor-not-allowed'}`}
                              disabled={!enabled}
                              onClick={() => { setSingleBlock(b); setSingleView('rooms'); }}
                            >
                              <div className="font-medium">{b}</div>
                              <div className="text-xs text-gray-500">Block</div>
                            </button>
                          );
                        })}
                      </div>
                      {!selectedGender && selectedStudent && (
                        <p className="text-sm text-amber-700 mt-2">Selected student has no gender set. Please update their profile first.</p>
                      )}
                    </div>
                  )}

                  {singleView === 'rooms' && (
                    <div className="mt-2">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600">Block: <span className="font-medium">{singleBlock}</span></div>
                        <button type="button" onClick={() => setSingleView('blocks')} className="text-sm text-violet-700 hover:underline">Back to blocks</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {rooms.filter(r => r.block === singleBlock).map(r => {
                          const occupied = Math.max(0, (r.capacity || 0) - (r.available || 0));
                          const full = (r.available || 0) <= 0;
                          const selected = String(assignForm.data.room_id) === String(r.id);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              disabled={full}
                              onClick={() => assignForm.setData('room_id', r.id)}
                              className={`rounded border p-3 text-sm text-center transition relative ${full ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'bg-white hover:ring-2 hover:ring-violet-300'} ${selected ? 'ring-2 ring-violet-500 border-violet-500' : ''}`}
                            >
                              <div className="font-medium">{r.room_number}</div>
                              <div className="text-[11px] text-gray-600">{occupied}/{r.capacity} occupied</div>
                              {full && <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">Full</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {assignForm.errors.room_id && <p className="text-sm text-red-600 mt-2">{assignForm.errors.room_id}</p>}
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
          )}

          {activeTab === 'bulk' && (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
              <form onSubmit={(e) => { e.preventDefault(); bulkForm.post(route('staff.residents.assignBulk')); }} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Select Students</label>
                    <button
                      type="button"
                      className={`text-xs px-2 py-1 rounded ${suggestionsEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => setSuggestionsEnabled(v => !v)}
                    >
                      {suggestionsEnabled ? 'Auto Suggestions: ON' : 'Auto Suggestions: OFF'}
                    </button>
                  </div>
                  <div className="max-h-56 overflow-auto border rounded p-2 space-y-1">
                    {students.map(s => (
                      <div key={s.id} className="flex items-center gap-2 justify-between">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => { if (suggestionsEnabled) fetchSuggestions(s.id); }}>
                          <input
                            type="checkbox"
                            checked={bulkForm.data.student_ids.includes(s.id)}
                            disabled={
                              (bulkGender && s.gender && s.gender !== bulkGender) ||
                              (bulkGender && !s.gender)
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                if (!bulkGender && s.gender) {
                                  bulkForm.setData('student_ids', [...bulkForm.data.student_ids, s.id]);
                                } else if (bulkGender && s.gender === bulkGender) {
                                  bulkForm.setData('student_ids', [...bulkForm.data.student_ids, s.id]);
                                }
                              } else {
                                bulkForm.setData('student_ids', bulkForm.data.student_ids.filter(id => id !== s.id));
                              }
                            }}
                          />
                          <span>
                            {s.name} ({s.email}){s.gender ? ` — ${s.gender}` : ' — gender not set'}
                          </span>
                        </label>
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
                  {/* Blocks/Rooms grid for Bulk */}
                  {bulkView === 'blocks' && (
                    <div className="mt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {allBlocks.map((b) => {
                          const enabled = !!bulkGender && enabledBlocksBulk.has(b);
                          return (
                            <button
                              key={b}
                              type="button"
                              className={`rounded border p-3 text-sm text-center transition ${enabled ? 'bg-white hover:ring-2 hover:ring-violet-300' : 'bg-gray-50 opacity-50 cursor-not-allowed'}`}
                              disabled={!enabled}
                              onClick={() => { setBulkBlock(b); setBulkView('rooms'); }}
                            >
                              <div className="font-medium">{b}</div>
                              <div className="text-xs text-gray-500">Block</div>
                            </button>
                          );
                        })}
                      </div>
                      {bulkGender === null && bulkForm.data.student_ids.length > 0 && (
                        <p className="text-sm text-amber-700 mt-2">First selected student has no gender set. Please update profile.</p>
                      )}
                    </div>
                  )}

                  {bulkView === 'rooms' && (
                    <div className="mt-2">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600">Block: <span className="font-medium">{bulkBlock}</span></div>
                        <button type="button" onClick={() => setBulkView('blocks')} className="text-sm text-violet-700 hover:underline">Back to blocks</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {rooms.filter(r => r.block === bulkBlock).map(r => {
                          const occupied = Math.max(0, (r.capacity || 0) - (r.available || 0));
                          const full = (r.available || 0) <= 0;
                          const selected = String(bulkForm.data.room_id) === String(r.id);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              disabled={full}
                              onClick={() => bulkForm.setData('room_id', r.id)}
                              className={`rounded border p-3 text-sm text-center transition relative ${full ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'bg-white hover:ring-2 hover:ring-violet-300'} ${selected ? 'ring-2 ring-violet-500 border-violet-500' : ''}`}
                            >
                              <div className="font-medium">{r.room_number}</div>
                              <div className="text-[11px] text-gray-600">{occupied}/{r.capacity} occupied</div>
                              {full && <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">Full</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {bulkForm.errors.room_id && <p className="text-sm text-red-600 mt-2">{bulkForm.errors.room_id}</p>}
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
          )}
        </div>

        {/* Suggestions Panel (Bulk Tab Only) */}
        {activeTab === 'bulk' && (
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
              <h3 className="font-semibold mb-3">Potential Roommates {suggestForId ? `for ${students.find(x => x.id === suggestForId)?.name || ''}` : ''}</h3>
              {!suggestForId && (
                <p className="text-sm text-gray-600">{suggestionsEnabled ? 'Click a student to automatically see potential roommates based on hobby, faculty, gender, interaction style, or daily schedule.' : 'Auto suggestions are disabled. Enable them to see potential roommates when clicking a student.'}</p>
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
        )}

        {/* Removed Current Residents section – separate page exists */}
      </div>
    </AuthenticatedLayout>
  );
}