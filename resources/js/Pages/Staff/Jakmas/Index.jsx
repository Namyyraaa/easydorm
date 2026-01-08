import React, { useMemo, useState, useEffect } from 'react';
import { useForm, Link, router, usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Search } from 'lucide-react';

export default function Index({ jakmas, staffDorm }) {
  const { props } = usePage();
  const flash = props.flash || {};
  const assignForm = useForm({ student_id: '' });
  const [search, setSearch] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Status filter + pagination for current/historical JAKMAS
  const rawJakmas = (jakmas?.data || jakmas || []);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const humanize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const badgeClassFor = (s) => {
    switch (s) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatDateTime = (dt) => {
    if (!dt) return 'N/A';
    try {
      return new Date(dt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };
  const firstTwoWords = (full) => {
    const words = (full || '').trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).join(' ');
  };

  const filtered = useMemo(() => {
    return rawJakmas.filter(j => (
      statusFilter === 'all' || (statusFilter === 'active' ? !!j.is_active : !j.is_active)
    ));
  }, [rawJakmas, statusFilter]);

  useEffect(() => { setPage(1); }, [statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  const doSearch = async (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) {
      setList([]);
      setSearched(true);
      return;
    }
    setLoading(true);
    try {
      const url = route('staff.jakmas.candidates', { q });
      const res = await fetch(url);
      const data = await res.json();
      setList(data);
      setSearched(true);
    } catch (err) {
      setList([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const assignCandidate = (id) => {
    router.post(route('staff.jakmas.assign'), { student_id: id }, {
      onSuccess: () => {
        setSearch('');
        setList([]);
        setSearched(false);
      }
    });
  };

  const assign = (e) => {
    e.preventDefault();
    assignForm.post(route('staff.jakmas.assign'));
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Manage JAKMAS</h2>}>
      <Head title="Manage JAKMAS" />
      {(flash.success || flash.error) && (
        <div className={`mx-auto max-w-7xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3 mt-6`}>
          {flash.error || flash.success}
        </div>
      )}
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Assign section */}
          <div className="overflow-hidden bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Assign JAKMAS</h3>
            <div className="text-sm text-gray-600 mb-3">Dorm: <span className="font-medium">{staffDorm?.name || staffDorm?.id || '-'}</span></div>
            <form onSubmit={doSearch} className="space-y-3">
              <label className="block text-sm font-medium">Search Student (Active Residents)</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-full">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input className="w-full rounded border border-violet-200 p-2 pl-8 focus:border-violet-500 focus:ring-violet-500" placeholder="Enter name or email" value={search} onChange={e=>setSearch(e.target.value)} />
                </div>
                <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
              </div>
              {assignForm.errors.student_id && <div className="text-red-600 text-sm">{assignForm.errors.student_id}</div>}

              {searched && (
                <div className="border rounded divide-y">
                  {list.length === 0 && (
                    <div className="p-3 text-sm text-gray-600">No matching residents found.</div>
                  )}
                  {list.map(s => (
                    <div key={s.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-sm text-gray-600">{s.email}</div>
                      </div>
                      <button type="button" onClick={() => assignCandidate(s.id)} className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">Assign</button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Current and Historical JAKMAS table */}
          <div className="bg-white shadow sm:rounded-lg p-6 mt-6">
            <h3 className="font-semibold mb-3">Current and Historical JAKMAS</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-3">
                <div className="flex items-center">
                  <label className="text-sm text-gray-600">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                  >
                    {['all','active','revoked'].map(s => (
                      <option key={s} value={s}>{humanize(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => { setStatusFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2 text-left">Name</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Assigned</th>
                  <th className="text-left">Revoked By</th>
                  <th className="text-left">Revoked At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map(j => (
                  <tr key={j.id} className="border-t">
                    <td className="py-2">{firstTwoWords(j.user?.name)}</td>
                    <td>{j.user?.email}</td>
                    <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(j.is_active ? 'active' : 'revoked')}`}>{j.is_active ? 'Active' : 'Revoked'}</span></td>
                    <td>{formatDateTime(j.assigned_at)}</td>
                    <td>{firstTwoWords(j.revokedBy?.name || j.revoked_by_user?.name || j.revoked_by?.name || j.revoked_by_user_name) || 'N/A'}</td>
                    <td>{formatDateTime(j.revoked_at)}</td>
                    <td>
                      {j.is_active ? (
                        <Link as="button" method="patch" href={route('staff.jakmas.revoke', j.id)} className="inline-flex items-center px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1">
                          Revoke
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
                {displayItems.length === 0 && (
                  <tr><td colSpan="7" className="py-3 text-gray-600">{rawJakmas.length === 0 ? 'No JAKMAS records found.' : 'No matching JAKMAS records.'}</td></tr>
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
