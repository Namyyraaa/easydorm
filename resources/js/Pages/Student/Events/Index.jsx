import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ events, announcements }) {
  const { props } = usePage();
  const userId = props?.auth?.user?.id;

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

  const statuses = useMemo(() => {
    const s = new Set(items.map(e => e.visibility).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [items]);

  const types = useMemo(() => {
    const t = new Set(items.map(e => e.type).filter(Boolean));
    return ['all', ...Array.from(t)];
  }, [items]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return items.filter(e => (
      (statusFilter === 'all' || e.visibility === statusFilter)
      && (typeFilter === 'all' || e.type === typeFilter)
    ));
  }, [items, statusFilter, typeFilter]);

  useEffect(() => { setPage(1); }, [statusFilter, typeFilter]);

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
    const t = new Set(annItems.map(e => e.type).filter(Boolean));
    return ['all', ...Array.from(t)];
  }, [annItems]);
  const [annStatusFilter, setAnnStatusFilter] = useState('all');
  const [annTypeFilter, setAnnTypeFilter] = useState('all');
  const [annPage, setAnnPage] = useState(1);
  const annPageSize = 10;
  const annFiltered = useMemo(() => {
    return annItems.filter(e => (
      (annStatusFilter === 'all' || e.visibility === annStatusFilter)
      && (annTypeFilter === 'all' || e.type === annTypeFilter)
    ));
  }, [annItems, annStatusFilter, annTypeFilter]);
  useEffect(() => { setAnnPage(1); }, [annStatusFilter, annTypeFilter]);
  const annTotalPages = Math.max(1, Math.ceil(annFiltered.length / annPageSize));
  const annStart = (annPage - 1) * annPageSize;
  const annEnd = annStart + annPageSize;
  const annDisplayItems = useMemo(() => annFiltered.slice(annStart, annEnd), [annFiltered, annStart, annEnd]);

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
  const [registeredIds, setRegisteredIds] = useState({});
  const handleRegister = (id) => {
    setRegisteringId(id);
    router.post(route('student.events.register', id), {}, {
      preserveScroll: true,
      onSuccess: () => setRegisteredIds(prev => ({ ...prev, [id]: true })),
      onFinish: () => setRegisteringId(null),
    });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Announcements & Events</h2>}>
      <div className="p-6 space-y-8">
        <section>
          <h3 className="text-lg font-semibold mb-3">Announcements</h3>
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
                      <option key={s} value={s}>{s === 'all' ? 'All' : humanize(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="text-sm text-gray-600">Type</label>
                  <select
                    value={annTypeFilter}
                    onChange={e => setAnnTypeFilter(e.target.value)}
                    className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                  >
                    {annTypes.map(t => (
                      <option key={t} value={t}>{t === 'all' ? 'All' : humanize(t)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => { setAnnStatusFilter('all'); setAnnTypeFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2 text-left">Title</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Capacity</th>
                  <th className="text-left">Starts</th>
                  <th className="text-left">Visibility</th>
                  <th className="text-left">Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {annDisplayItems.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{a.name}</td>
                    <td>{a.type}</td>
                    <td>{a.capacity != null ? a.capacity : 'N/A'}</td>
                    <td>{a.starts_at ? new Date(a.starts_at).toLocaleString() : '-'}</td>
                    <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(a.visibility)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{(a.visibility || '').replace(/_/g, ' ')}</span></td>
                    <td>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Link href={route('student.events.show', a.id)} className="inline-flex items-center px-3 py-1 rounded border text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {annDisplayItems.length === 0 && (
                  <tr><td colSpan="7" className="py-3 text-gray-600">{annItems.length === 0 ? 'No announcements right now.' : 'No matching announcements.'}</td></tr>
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

        <section>
          <h3 className="text-lg font-semibold mb-3">Events</h3>
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
                      <option key={s} value={s}>{s === 'all' ? 'All' : humanize(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="text-sm text-gray-600">Type</label>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                  >
                    {types.map(t => (
                      <option key={t} value={t}>{t === 'all' ? 'All' : humanize(t)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2 text-left">Title</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Capacity</th>
                  <th className="text-left">Starts</th>
                  <th className="text-left">Visibility</th>
                  <th className="text-left">Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map(e => (
                  <tr key={e.id} className="border-t">
                    <td className="py-2">{e.name}</td>
                    <td>{e.type}</td>
                    <td>{e.capacity != null ? e.capacity : 'N/A'}</td>
                    <td>{e.starts_at ? new Date(e.starts_at).toLocaleString() : '-'}</td>
                    <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(e.visibility)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{(e.visibility || '').replace(/_/g, ' ')}</span></td>
                    <td>{e.created_at ? new Date(e.created_at).toLocaleString() : ''}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Link href={route('student.events.show', e.id)} className="inline-flex items-center px-3 py-1 rounded border text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
                          View
                        </Link>
                        {isRegistered(e) || registeredIds[e.id] ? (
                          <span className="inline-flex items-center px-3 py-1 rounded bg-gray-200 text-gray-600 cursor-default uppercase">REGISTERED</span>
                        ) : (
                          <button
                            onClick={() => handleRegister(e.id)}
                            disabled={registeringId === e.id}
                            className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 disabled:opacity-60"
                          >
                            {registeringId === e.id ? 'Registering...' : 'Register'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {displayItems.length === 0 && (
                  <tr><td colSpan="7" className="py-3 text-gray-600">{items.length === 0 ? 'No events yet.' : 'No matching events.'}</td></tr>
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
      </div>
    </AuthenticatedLayout>
  );
}
