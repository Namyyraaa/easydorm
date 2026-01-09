import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function StaffMaintenanceIndex() {
  const { props } = usePage();
  const raw = props.requests || [];
  const items = Array.isArray(raw) ? raw : (raw?.data || []);
  const flash = props.flash || {};

  const initialStatus = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('status')) || 'all';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [blockFilter, setBlockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const humanize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const badgeClassFor = (s) => {
    switch (s) {
      case 'submitted':
        return 'bg-gray-100 text-gray-800';
      case 'reviewed':
        return 'bg-sky-100 text-sky-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statuses = useMemo(() => {
    const s = new Set(items.map(r => r.status).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [items]);

  const blocks = useMemo(() => {
    const b = new Set(items.map(r => r.block?.name).filter(Boolean));
    return ['all', ...Array.from(b)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(r => (
      (statusFilter === 'all' || r.status === statusFilter) &&
      (blockFilter === 'all' || r.block?.name === blockFilter)
    ));
  }, [items, statusFilter, blockFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, blockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dorm Maintenance Requests</h2>}>
      <Head title="Maintenance" />
      <div className="py-12 space-y-6">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>{flash.error || flash.success}</div>
        )}
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
          <h3 className="font-semibold mb-3">Requests</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3">
              <div className="flex items-center">
                <label className="text-sm text-gray-600">Status</label>
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
                <label className="text-sm text-gray-600">Block</label>
                <select
                  value={blockFilter}
                  onChange={e => setBlockFilter(e.target.value)}
                  className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] max-h-60 overflow-y-auto focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                >
                  {blocks.map(b => (
                    <option key={b} value={b}>{b === 'all' ? 'All' : b}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={() => { setStatusFilter('all'); setBlockFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
          </div>
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
              {displayItems.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.title}</td>
                  <td>{r.student?.name}</td>
                  <td>{r.block?.name || '-'}</td>
                  <td>{r.room?.room_number || '-'}</td>
                  <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(r.status)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{(r.status || '').replace(/_/g, ' ')}</span></td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
                  <td>
                    <Link href={route('staff.maintenance.show', r.id)} className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {displayItems.length === 0 && (
                <tr><td colSpan="7" className="py-3 text-gray-600">{items.length === 0 ? 'No requests yet.' : 'No matching requests.'}</td></tr>
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
    </AuthenticatedLayout>
  );
}
