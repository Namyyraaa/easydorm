import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { X } from 'lucide-react';

export default function Residents() {
  const { props } = usePage();
  const students = props.students || [];
  const residents = props.residents || [];
  const myDorm = props.myDorm || null;
  const rooms = props.rooms || [];
  const blocks = props.blocks || [];
  const flash = props.flash || {};

  const assignForm = useForm({ student_id: '', room_id: '', check_in_date: '', check_out_date: ''});
  const bulkForm = useForm({ student_ids: [], room_id: '', check_in_date: '', check_out_date: ''});
  const [revokingId, setRevokingId] = useState(null);
  const [suggestForId, setSuggestForId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);

  // Searchable dropdown state for single assignment
  const [studentQuery, setStudentQuery] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [studentVisibleCount, setStudentVisibleCount] = useState(20);
  const studentInputRef = useRef(null);
  const studentDropdownRef = useRef(null);

  // Derive selected student and gender for single assignment
  const selectedStudent = useMemo(() => students.find(s => String(s.id) === String(assignForm.data.student_id)), [students, assignForm.data.student_id]);
  const selectedGender = selectedStudent?.gender || null;

  // Keep input display in sync with selected student
  useEffect(() => {
    if (selectedStudent && selectedStudent.name) {
      setStudentQuery(selectedStudent.name);
    }
  }, [selectedStudent]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClickAway = (e) => {
      if (!studentDropdownOpen) return;
      if (studentDropdownRef.current && studentDropdownRef.current.contains(e.target)) return;
      if (studentInputRef.current && studentInputRef.current.contains(e.target)) return;
      setStudentDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [studentDropdownOpen]);

  // Filtered and visible lists for dropdown
  const studentFilteredAll = useMemo(() => {
    const q = (studentQuery || '').trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [students, studentQuery]);
  const studentVisibleList = useMemo(() => {
    return studentFilteredAll.slice(0, studentVisibleCount);
  }, [studentFilteredAll, studentVisibleCount]);
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
  // Number of slots required based on selected students in bulk
  const requiredSlots = bulkForm.data.student_ids.length || 0;

  // Filter rooms further by availability when there are selected students
  const filteredRoomsBulkAvailable = useMemo(() => {
    if (!requiredSlots) return filteredRoomsBulk;
    return filteredRoomsBulk.filter(r => (r.available || 0) >= requiredSlots);
  }, [filteredRoomsBulk, requiredSlots]);

  useEffect(() => {
    // Clear selected room if it no longer exists in the availability-filtered list
    if (bulkForm.data.room_id && !filteredRoomsBulkAvailable.some(r => String(r.id) === String(bulkForm.data.room_id))) {
      bulkForm.setData('room_id', '');
    }
  }, [filteredRoomsBulkAvailable, bulkForm.data.room_id]);

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

  // Derive block list from backend-provided blocks (shows all active blocks, even if no rooms yet)
  const allBlocks = useMemo(() => {
    const set = new Set((blocks || []).map(b => b.name).filter(Boolean));
    return Array.from(set);
  }, [blocks]);

  // Enabled blocks based on gender-filtered rooms
  const enabledBlocksSingle = useMemo(() => {
    const set = new Set((filteredRoomsSingle || []).map(r => r.block).filter(Boolean));
    return set;
  }, [filteredRoomsSingle]);
  const enabledBlocksBulk = useMemo(() => {
    const set = new Set((filteredRoomsBulkAvailable || []).map(r => r.block).filter(Boolean));
    return set;
  }, [filteredRoomsBulkAvailable]);

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

  // Submit handler that clears UI on success
  const submitAssign = (e) => {
    e.preventDefault();
    assignForm.post(route('staff.residents.assign'), {
      onSuccess: () => {
        assignForm.reset();
        setStudentQuery('');
        setStudentDropdownOpen(false);
        setStudentVisibleCount(20);
        setSingleView('blocks');
        setSingleBlock(null);
      },
    });
  };

  // Date helpers: add/subtract days and validate checkout > checkin
  const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isCheckoutValidForCheckin = (checkout, checkin) => {
    if (!checkout || !checkin) return true;
    // require checkout to be strictly after checkin (no same-day checkout)
    return checkout > checkin;
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

        {/* Tabbed Assignment Forms */}
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="border-b border-violet-200 mb-6">
            <nav className="-mb-px flex w-full" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-1 ${activeTab === 'single' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Assign Resident (Single){myDorm ? ` — ${myDorm.name} ` : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bulk')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-2 ${activeTab === 'bulk' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Assign Residents (Bulk){myDorm ? ` — ${myDorm.name} ` : ''}
              </button>
            </nav>
          </div>

          {activeTab === 'single' && (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
              <form onSubmit={submitAssign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Student</label>
                  <div className="mt-1 relative">
                    <input
                      ref={studentInputRef}
                      type="text"
                      placeholder="Search student by name or email"
                      className="block w-full shadow border-violet-200 transition-shadow hover:ring-2 hover:ring-violet-300 focus:border-violet-500 focus:ring-violet-500 px-2 py-2 rounded"
                      value={studentQuery}
                      onFocus={() => { setStudentDropdownOpen(true); setStudentVisibleCount(20); }}
                      onChange={(e) => { setStudentQuery(e.target.value); setStudentDropdownOpen(true); setStudentVisibleCount(20); }}
                    />
                    {assignForm.data.student_id && (
                      <button
                        type="button"
                        onClick={() => {
                          assignForm.setData('student_id', '');
                          setStudentQuery('');
                          setStudentDropdownOpen(true);
                          setTimeout(() => studentInputRef.current?.focus(), 0);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                        aria-label="Clear selected student"
                      >
                        <X />
                      </button>
                    )}
                    {studentDropdownOpen && (
                      <div
                        ref={studentDropdownRef}
                        className="absolute z-10 mt-1 w-full bg-white border border-violet-200 rounded shadow max-h-56 overflow-y-auto"
                      >
                        {studentVisibleList.map(s => {
                          const selected = String(assignForm.data.student_id) === String(s.id);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              className={`w-full text-left px-3 py-2 text-sm ${selected ? 'bg-violet-50 text-violet-800' : 'hover:bg-violet-50'} flex items-center justify-between`}
                              onClick={() => { assignForm.setData('student_id', s.id); setStudentQuery(s.name || ''); setStudentDropdownOpen(false); }}
                            >
                              <span>{s.name} <span className="text-gray-500">({s.email})</span></span>
                              {selected && <span className="text-xs text-violet-600">Selected</span>}
                            </button>
                          );
                        })}
                        {studentVisibleList.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-600">No results</div>
                        )}
                        {studentVisibleCount < studentFilteredAll.length && (
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-sm text-violet-700 hover:bg-violet-50 text-left"
                            onClick={() => setStudentVisibleCount(c => c + 20)}
                          >
                            Load more...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {assignForm.errors.student_id && <p className="text-sm text-red-600">{assignForm.errors.student_id}</p>}
                </div>
                {/* Dorm is auto-selected from your staff assignment */}
                <div>
                  <label className="block text-sm font-medium">Select Room</label>
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
                    <input
                      type="date"
                      className="mt-1 block w-full shadow border-violet-200 transition-shadow hover:ring-2 hover:ring-violet-300 focus:border-violet-500 focus:ring-violet-500 px-2 py-2 rounded"
                      value={assignForm.data.check_in_date}
                      max={assignForm.data.check_out_date ? addDays(assignForm.data.check_out_date, -1) : undefined}
                      onChange={(e) => {
                        const v = e.target.value;
                        assignForm.setData('check_in_date', v);
                        // if existing checkout is not strictly after new checkin, clear it
                        if (assignForm.data.check_out_date && !isCheckoutValidForCheckin(assignForm.data.check_out_date, v)) {
                          assignForm.setData('check_out_date', '');
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Check-out Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full shadow border-violet-200 transition-shadow hover:ring-2 hover:ring-violet-300 focus:border-violet-500 focus:ring-violet-500 px-2 py-2 rounded"
                      value={assignForm.data.check_out_date}
                      min={assignForm.data.check_in_date ? addDays(assignForm.data.check_in_date, 1) : undefined}
                      onChange={(e) => {
                        const v = e.target.value;
                        // prevent selecting invalid checkout; if invalid, ignore selection
                        if (assignForm.data.check_in_date && !isCheckoutValidForCheckin(v, assignForm.data.check_in_date)) {
                          // clear or keep previous valid value; here we ignore the invalid pick
                          assignForm.setData('check_out_date', '');
                        } else {
                          assignForm.setData('check_out_date', v);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4">
                <button type="submit" disabled={assignForm.processing} className="px-4 py-2 text-white rounded bg-violet-600 hover:bg-violet-700 focus:bg-violet-700 focus:ring-violet-400">Assign</button>
              </div>
              </form>
            </div>
          )}

          {activeTab === 'bulk' && (
            <form onSubmit={(e) => { e.preventDefault(); bulkForm.post(route('staff.residents.assignBulk')); }} className="space-y-6">
              {/* Top row: Select Students and Potential Roommates in separate boxes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Select Students Card */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium">Select Students</label>
                      <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded ${suggestionsEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        onClick={() => setSuggestionsEnabled(v => !v)}
                      >
                        {suggestionsEnabled ? 'Auto Suggestions: ON' : 'Auto Suggestions: OFF'}
                      </button>
                    </div>
                    <div className="max-h-56 overflow-auto">
                      <div className="space-y-2">
                        {students.map(s => {
                          const isSelected = bulkForm.data.student_ids.includes(s.id);
                          const disabledSel = (bulkGender && s.gender && s.gender !== bulkGender) || (bulkGender && !s.gender);
                          const baseCls = 'w-full text-left px-3 py-2 rounded border text-sm flex items-center justify-between transition hover:bg-violet-300 focus:outline-none ';
                          const stateCls = disabledSel
                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            : isSelected
                              ? 'bg-violet-500 text-white border-violet-500'
                              : 'bg-white text-gray-700 border-gray-300';
                          return (
                            <button
                              key={s.id}
                              type="button"
                              className={`${baseCls} ${stateCls}`}
                              disabled={disabledSel}
                              onClick={() => {
                                // Toggle selection with gender lock rules
                                if (isSelected) {
                                  bulkForm.setData('student_ids', bulkForm.data.student_ids.filter(id => id !== s.id));
                                  if (suggestForId === s.id) { setSuggestForId(null); setSuggestions([]); }
                                } else {
                                  if (!bulkGender && s.gender) {
                                    bulkForm.setData('student_ids', [...bulkForm.data.student_ids, s.id]);
                                    if (suggestionsEnabled) fetchSuggestions(s.id);
                                  } else if (bulkGender && s.gender === bulkGender) {
                                    bulkForm.setData('student_ids', [...bulkForm.data.student_ids, s.id]);
                                    if (suggestionsEnabled) fetchSuggestions(s.id);
                                  }
                                }
                              }}
                            >
                              <span>{s.name}</span>
                              <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'} ${s.gender ? 'capitalize' : ''}`}>{s.gender ? s.gender : 'Gender Not Set'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {bulkForm.errors.student_ids && <p className="text-sm text-red-600 mt-2">{bulkForm.errors.student_ids}</p>}
                    {bulkGender && (
                      <p className="text-xs text-gray-600 mt-1">Bulk gender locked to: <span className="font-medium">{bulkGender ? bulkGender.charAt(0).toUpperCase() + bulkGender.slice(1) : ''}</span>. Only matching gender can be selected.</p>
                    )}
                  </div>
                </div>

                {/* Potential Roommates Card */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                  <div className="p-6">
                    <h3 className="block text-sm font-medium py-0.5 mb-3">Potential Roommates {suggestForId ? `for ${students.find(x => x.id === suggestForId)?.name || ''}` : ''}</h3>
                    <div className="max-h-56 overflow-auto space-y-2">
                      {!suggestForId && (
                        <p className="text-sm text-gray-600">{suggestionsEnabled ? 'Click a student to automatically see potential roommates.' : 'Auto suggestions are disabled. Enable them to see potential roommates when clicking a student.'}</p>
                      )}
                      {suggestForId && (
                        <div>
                          {loadingSuggestions ? (
                            <p className="text-sm text-gray-600">Loading suggestions...</p>
                          ) : (
                            <div className="space-y-2">
                              {suggestions.map(item => {
                                const cand = students.find(s => String(s.id) === String(item.id));
                                const isSelected = cand ? bulkForm.data.student_ids.includes(cand.id) : false;
                                return (
                                  <div key={item.id} className={`${isSelected ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-700 border-gray-300'} w-full rounded border px-3 py-2 flex items-center justify-between transition`}>
                                    <div className="min-w-0">
                                      <div className="text-sm truncate">{item.name}</div>
                                      {Array.isArray(item.matches) && item.matches.length > 0 && (
                                        <div className={`mt-1 text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                                          <span className={`${isSelected ? 'text-white' : 'text-gray-500'} font-medium mr-2`}>Similarities:</span>
                                          <span className="inline-flex flex-wrap gap-1">
                                            {item.matches.map((m, idx) => (
                                              <span key={idx} className={`${isSelected ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'} text-[10px] uppercase px-2 py-0.5 rounded`}>{m.replace('_',' ')}</span>
                                            ))}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="ms-3 flex-shrink-0">
                                      <button
                                        type="button"
                                        className={`${isSelected ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'} text-xs px-2 py-1 rounded`}
                                        onClick={() => {
                                          if (!cand) return;
                                          if (isSelected) {
                                            bulkForm.setData('student_ids', bulkForm.data.student_ids.filter(id => id !== cand.id));
                                            if (suggestForId === cand.id) { setSuggestForId(null); setSuggestions([]); }
                                          } else {
                                            if (!bulkGender && cand.gender) {
                                              bulkForm.setData('student_ids', [...bulkForm.data.student_ids, cand.id]);
                                            } else if (bulkGender && cand.gender === bulkGender) {
                                              bulkForm.setData('student_ids', [...bulkForm.data.student_ids, cand.id]);
                                            }
                                          }
                                        }}
                                      >
                                        {isSelected ? 'Cancel' : 'Add'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {suggestions.length === 0 && (
                                <p className="text-sm text-gray-600">No matching students found.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Room selection and dates below in a separate box */}
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Select Room</label>
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
                            const enough = (r.available || 0) >= requiredSlots;
                            const full = !enough;
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
                                {full && <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">No space</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {bulkForm.errors.room_id && <p className="text-sm text-red-600 mt-2">{bulkForm.errors.room_id}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium">Check-in Date</label>
                        <input
                          type="date"
                          className="mt-1 block w-full shadow border-violet-200 transition-shadow hover:ring-2 hover:ring-violet-300 focus:border-violet-500 focus:ring-violet-500 px-2 py-2 rounded"
                          value={bulkForm.data.check_in_date}
                          max={bulkForm.data.check_out_date ? addDays(bulkForm.data.check_out_date, -1) : undefined}
                          onChange={(e) => {
                            const v = e.target.value;
                            bulkForm.setData('check_in_date', v);
                            if (bulkForm.data.check_out_date && !isCheckoutValidForCheckin(bulkForm.data.check_out_date, v)) {
                              bulkForm.setData('check_out_date', '');
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Check-out Date</label>
                        <input
                          type="date"
                          className="mt-1 block w-full shadow border-violet-200 transition-shadow hover:ring-2 hover:ring-violet-300 focus:border-violet-500 focus:ring-violet-500 px-2 py-2 rounded"
                          value={bulkForm.data.check_out_date}
                          min={bulkForm.data.check_in_date ? addDays(bulkForm.data.check_in_date, 1) : undefined}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (bulkForm.data.check_in_date && !isCheckoutValidForCheckin(v, bulkForm.data.check_in_date)) {
                              bulkForm.setData('check_out_date', '');
                            } else {
                              bulkForm.setData('check_out_date', v);
                            }
                          }}
                        />
                      </div>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    <button type="submit" disabled={bulkForm.processing || bulkForm.data.student_ids.length === 0} className="px-4 py-2 text-white rounded bg-violet-600 hover:bg-violet-700 focus:bg-violet-700 focus:ring-violet-400">Assign Selected</button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Suggestions integrated inside bulk form above */}

        {/* Removed Current Residents section – separate page exists */}
      </div>
    </AuthenticatedLayout>
  );
}