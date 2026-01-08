import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function StaffFineAppealsIndex() {
  const { props } = usePage();
  const items = props.items || [];
  const students = props.students || [];
  const statuses = props.statuses || [];
  // Filters and pagination (match Fines list UX)
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchStudentId, setSearchStudentId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const humanize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const badgeClassFor = (s) => {
    switch (s) {
      case 'pending':
        return 'bg-sky-100 text-sky-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '-';
    try {
      return new Date(dt).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const listStatuses = useMemo(() => ['all', ...Array.from(new Set(statuses))], [statuses]);

  const filtered = useMemo(() => {
    return items.filter((it) => (
      (statusFilter === 'all' || it.status === statusFilter) &&
      (searchStudentId == null || String(it.student?.id) === String(searchStudentId))
    ));
  }, [items, statusFilter, searchStudentId]);

  useEffect(() => { setPage(1); }, [statusFilter, searchStudentId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayItems = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Fine Appeals</h2>}>
      <Head title="Fine Appeals" />
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
          <h3 className="font-semibold mb-3">Appeals</h3>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3">
              <div className="flex items-center w-64">
                <ResidentSearch
                  label=""
                  compact
                  students={students}
                  valueId={searchStudentId}
                  onSelect={(s) => setSearchStudentId(s?.id ?? null)}
                />
              </div>
              <div className="flex items-center">
                <label className="text-sm text-gray-600">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                >
                  {listStatuses.map((s) => (
                    <option key={s} value={s}>{s === 'all' ? 'All' : humanize(s)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={() => { setStatusFilter('all'); setSearchStudentId(null); }} className="text-sm text-gray-600 hover:underline">Reset</button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600">
                <th className="py-2 text-left">Appeal</th>
                <th className="text-left">Fine</th>
                <th className="text-left">Student</th>
                <th className="text-left">Status</th>
                <th className="text-left">Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="py-2">#{it.id}</td>
                  <td>{it.fine?.fine_code || '-'}</td>
                  <td>{it.student?.name || '-'}</td>
                  <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(it.status)}`}>{humanize(it.status)}</span></td>
                  <td>{formatDateTime(it.submitted_at)}</td>
                  <td>
                    <Link href={route('staff.fineAppeals.show', it.id)} className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {displayItems.length === 0 && (
                <tr><td colSpan="6" className="py-3 text-gray-600">{items.length === 0 ? 'No appeals found.' : 'No matching appeals.'}</td></tr>
              )}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filtered.length)} of {filtered.length}</div>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${page === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function ResidentSearch({ students, valueId, onSelect, error, label = 'Student', compact = false }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!valueId) {
      setSelected(null);
      setQuery('');
      return;
    }
    const s = students.find((st) => String(st.id) === String(valueId));
    if (s) {
      setSelected(s);
      setQuery(s.name);
    }
  }, [valueId, students]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter((s) => s.name?.toLowerCase().includes(q) || String(s.id).includes(q))
      .slice(0, 10);
  }, [debouncedQuery, students]);

  const handleSelect = (s) => {
    setSelected(s);
    setQuery(s.name);
    onSelect?.(s);
    setOpen(false);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery('');
    onSelect?.(null);
    setOpen(true);
  };

  return (
    <div className="relative">
      {label ? (
        <label className="block text-sm font-medium text-violet-800">{label}</label>
      ) : null}
      <div className={`${label ? 'mt-1 ' : ''}relative`}>
        <input
          type="text"
          className={`w-full rounded border border-violet-200 ${compact ? 'p-1.5 text-sm' : 'p-2'} pr-9 focus:border-violet-500 focus:ring-violet-500 ${selected ? 'bg-violet-50' : ''}`}
          placeholder="Search by name or ID..."
          value={query}
          onChange={(e) => { if (selected) setSelected(null); setQuery(e.target.value); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          readOnly={!!selected}
        />
        {(selected || query) && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear"
            title="Clear"
          >
            ×
          </button>
        )}
        {open && !selected && debouncedQuery && (
          <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded border border-violet-200 bg-white shadow">
            {results.length > 0 ? (
              results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(s)}
                    className="block w-full px-3 py-2 text-left hover:bg-violet-50"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">ID {s.id}</div>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-600">No matches</li>
            )}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
