import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ events, announcements }) {
  const { props } = usePage();
  const userId = props?.auth?.user?.id;
  const studentDormCode = props?.studentDormCode || '';
  const serverRegisteredIds = (props?.userRegisteredEventIds || []).map(String);

  const raw = events || [];
  const items = Array.isArray(raw) ? raw : (raw?.data || []);
  const annRaw = announcements || [];
  const annItems = Array.isArray(annRaw) ? annRaw : (annRaw?.data || []);

  const humanize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const badgeClassFor = (s) => {
    switch (s) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const dormCodeFor = (e) => {
    const dorm = e?.dorm;
    return (
      dorm?.code ||
      e?.dorm_code ||
      studentDormCode ||
      ''
    );
  };

  const visibilityLabelFor = (e) => {
    const v = (e?.visibility || '').toLowerCase();
    if (v === 'closed') {
      const code = dormCodeFor(e);
      return code ? `${code} Only` : 'Dorm Only';
    }
    return humanize(v);
  };

  const statusLabel = (s) => {
    if (s === 'all') return 'All';
    if (s === 'closed') {
      const code = (studentDormCode || '').toUpperCase();
      return code ? `${code} Only` : 'Dorm Only';
    }
    return humanize(s);
  };

  

  const statuses = useMemo(() => {
    const s = new Set(items.map(e => e.visibility).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [items]);

  // Type filter removed

  const [statusFilter, setStatusFilter] = useState('all');
  // Type filter removed
  const [registeredOnly, setRegisteredOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const getRegisteredCount = (e) => {
    const regs = e?.registrations;
    if (Array.isArray(regs)) return regs.length;
    const counts = e?.registration_count ?? e?.registrations_count ?? e?.attendees_count;
    if (typeof counts === 'number') return counts;
    return 0;
  };

  const formatDate = (dt) => {
    try {
      const d = new Date(dt);
      const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return (
        <div className="flex flex-col">
          <span>{date}</span>
          <span className="text-gray-500">{time}</span>
        </div>
      );
    } catch {
      return '-';
    }
  };

  // Clamp to two lines for long titles
  const clamp2 = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  // Registration helpers/state must be declared before filters to avoid TDZ
  const isRegistered = (e) => {
    const direct = e?.is_registered ?? e?.registered ?? e?.user_is_registered ?? e?.attending ?? e?.user_registration;
    if (direct) return true;
    const regs = e?.registrations;
    if (Array.isArray(regs) && userId != null) {
      return regs.some(r => String(r?.user_id ?? r?.userId ?? r?.id) === String(userId));
    }
    return false;
  };

  const [registeringId, setRegisteringId] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(() => {
    const map = {};
    serverRegisteredIds.forEach(id => { map[id] = true; });
    return map;
  });

  useEffect(() => {
    const map = {};
    serverRegisteredIds.forEach(id => { map[id] = true; });
    setRegisteredIds(map);
  }, [serverRegisteredIds.join(',')]);

  const filtered = useMemo(() => {
    return items.filter(e => (
      (statusFilter === 'all' || e.visibility === statusFilter)
      && (!registeredOnly || isRegistered(e) || registeredIds[e.id])
    ));
  }, [items, statusFilter, registeredOnly, registeredIds]);

  useEffect(() => { setPage(1); }, [statusFilter, registeredOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  // Announcements table state
  const annStatuses = useMemo(() => {
    const s = new Set(annItems.map(e => e.visibility).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [annItems]);
  const annTypes = useMemo(() => {
    // Type filter removed
    return ['all'];
  }, [annItems]);
  const [annStatusFilter, setAnnStatusFilter] = useState('all');
  const [annPage, setAnnPage] = useState(1);
  const annPageSize = 10;
  const annFiltered = useMemo(() => {
    return annItems.filter(e => (
      (annStatusFilter === 'all' || e.visibility === annStatusFilter)
    ));
  }, [annItems, annStatusFilter]);
  useEffect(() => { setAnnPage(1); }, [annStatusFilter]);
  const annTotalPages = Math.max(1, Math.ceil(annFiltered.length / annPageSize));
  const annStart = (annPage - 1) * annPageSize;
  const annEnd = annStart + annPageSize;
  const annDisplayItems = useMemo(() => annFiltered.slice(annStart, annEnd), [annFiltered, annStart, annEnd]);

  // Tabs state (Announcements | Events), persisted via ?tab
  const initialTabParam = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) || 'events';
  const [activeTab, setActiveTab] = useState(initialTabParam === 'announcements' ? 'announcements' : 'events');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url);
  }, [activeTab]);
  
  const handleRegister = (id) => {
    setRegisteringId(id);
    router.post(route('student.events.register', id), {}, {
      preserveScroll: true,
      onSuccess: () => setRegisteredIds(prev => ({ ...prev, [id]: true })),
      onFinish: () => setRegisteringId(null),
    });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Events</h2>}>
      <Head title="Events" />
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          {/* Tabs header */}
          <div className="border-b border-violet-200 mb-6">
            <nav className="-mb-px flex w-full" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-2 ${activeTab === 'announcements' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Announcements
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-1 ${activeTab === 'events' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                Events
              </button>
            </nav>
          </div>

          {activeTab === 'announcements' && (
            <section>
              <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="flex items-center">
                      <label className="text-sm text-gray-600">Visibility</label>
                      <select
                        value={annStatusFilter}
                        onChange={e => setAnnStatusFilter(e.target.value)}
                        className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                      >
                        {annStatuses.map(s => (
                          <option key={s} value={s}>{statusLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => { setAnnStatusFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="py-2 text-left w-1/3 md:w-2/5">Title</th>
                      <th className="text-left">Capacity</th>
                      <th className="text-left">Starts</th>
                      <th className="text-left">Ends</th>
                      <th className="text-left">Visibility</th>
                      <th className="text-left w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annDisplayItems.map(a => (
                      <tr key={a.id} className="border-t">
                        <td className="py-2 w-1/3 md:w-2/5">
                          <span className="block whitespace-normal wrap-break-word" style={clamp2}>{a.name}</span>
                        </td>
                        <td>{`${getRegisteredCount(a)} / ${a.capacity != null ? a.capacity : '-'}`}</td>
                        <td>{a.starts_at ? formatDate(a.starts_at) : '-'}</td>
                        <td>{a.ends_at ? formatDate(a.ends_at) : '-'}</td>
                        <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(a.visibility)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{visibilityLabelFor(a)}</span></td>
                        <td className="py-2 w-24">
                          <div className="flex items-center gap-2">
                            <Link href={route('student.events.show', a.id)} className="inline-flex items-center px-3 py-1 rounded border text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {annDisplayItems.length === 0 && (
                      <tr><td colSpan="6" className="py-3 text-gray-600">{annItems.length === 0 ? 'No announcements right now.' : 'No matching announcements.'}</td></tr>
                    )}
                  </tbody>
                </table>

                {annFiltered.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">Showing {annStart + 1} - {Math.min(annEnd, annFiltered.length)} of {annFiltered.length}</div>
                    <div className="flex items-center gap-1">
                      <button disabled={annPage === 1} onClick={() => setAnnPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                      {Array.from({ length: annTotalPages }).map((_, i) => (
                        <button key={i} onClick={() => setAnnPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${annPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                      ))}
                      <button disabled={annPage === annTotalPages} onClick={() => setAnnPage(p => Math.min(annTotalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'events' && (
            <section>
              <div className="bg-white shadow sm:rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="flex items-center">
                      <label className="text-sm text-gray-600">Visibility</label>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                      >
                        {statuses.map(s => (
                          <option key={s} value={s}>{statusLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input id="registeredOnly" type="checkbox" checked={registeredOnly} onChange={e => setRegisteredOnly(e.target.checked)} />
                      <label htmlFor="registeredOnly" className="ml-2 text-sm text-gray-600">Registered only</label>
                    </div>
                  </div>
                  <button onClick={() => { setStatusFilter('all'); setRegisteredOnly(false); }} className="text-sm text-gray-600 hover:underline">Reset</button>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="py-2 text-left w-1/3 md:w-2/5">Title</th>
                      <th className="text-left">Capacity</th>
                      <th className="text-left">Starts</th>
                      <th className="text-left">Ends</th>
                      <th className="text-left">Visibility</th>
                      <th className="text-left w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map(e => (
                      <tr key={e.id} className="border-t">
                        <td className="py-2 w-1/3 md:w-2/5">
                          <span className="block whitespace-normal wrap-break-word" style={clamp2}>{e.name}</span>
                        </td>
                        <td>{`${getRegisteredCount(e)} / ${e.capacity != null ? e.capacity : '-'}`}</td>
                        <td>{e.starts_at ? formatDate(e.starts_at) : '-'}</td>
                        <td>{e.ends_at ? formatDate(e.ends_at) : '-'}</td>
                        <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(e.visibility)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{visibilityLabelFor(e)}</span></td>
                        <td className="py-2 w-24">
                          <div className="flex items-center gap-2">
                            <Link href={route('student.events.show', e.id)} className="inline-flex items-center px-3 py-1 rounded border text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
                              View
                            </Link>
                            {isRegistered(e) || registeredIds[e.id] ? (
                              <span className="inline-flex items-center px-3 py-1 rounded bg-gray-200 text-gray-600 cursor-default uppercase">REGISTERED</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayItems.length === 0 && (
                      <tr><td colSpan="6" className="py-3 text-gray-600">{items.length === 0 ? 'No events yet.' : 'No matching events.'}</td></tr>
                    )}
                  </tbody>
                </table>

                {filtered.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filtered.length)} of {filtered.length}</div>
                    <div className="flex items-center gap-1">
                      <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${page === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                      ))}
                      <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
