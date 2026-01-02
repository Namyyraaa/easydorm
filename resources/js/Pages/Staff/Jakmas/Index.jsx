import React, { useState } from 'react';
import { useForm, Link, router, usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ jakmas, staffDorm }) {
  const { props } = usePage();
  const flash = props.flash || {};
  const assignForm = useForm({ student_id: '' });
  const [search, setSearch] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
      <div className="p-6 max-w-4xl space-y-6">
        <form onSubmit={doSearch} className="border rounded p-4 space-y-3">
          <div className="font-medium">Assign JAKMAS</div>
          <div className="text-sm text-gray-600">Dorm: <span className="font-medium">{staffDorm?.name || staffDorm?.id || '-'}</span></div>
          <div>
            <label className="block text-sm">Search Student (Active Residents)</label>
            <div className="flex gap-2">
              <input className="border rounded w-full" placeholder="Enter name or email" value={search} onChange={e=>setSearch(e.target.value)} />
              <button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
            </div>
            {assignForm.errors.student_id && <div className="text-red-600 text-sm mt-1">{assignForm.errors.student_id}</div>}
          </div>
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
                  <button type="button" onClick={() => assignCandidate(s.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded">Assign</button>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="space-y-2">
          <div className="font-medium">Current and Historical JAKMAS</div>
          <div className="border rounded divide-y">
            {(jakmas?.data || []).map(j => (
              <div key={j.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{j.user?.name} <span className="text-xs text-gray-500">(#{j.user?.id})</span></div>
                  <div className="text-sm text-gray-600">{j.user?.email} · Dorm: {j.dorm?.name || j.dorm_id} · Assigned: {j.assigned_at ? new Date(j.assigned_at).toLocaleString() : '-'}</div>
                  {!j.is_active && <div className="text-xs text-gray-500">Revoked</div>}
                </div>
                {j.is_active ? (
                  <Link as="button" method="patch" href={route('staff.jakmas.revoke', j.id)} className="text-red-600">Revoke</Link>
                ) : (
                  <span className="text-gray-400 text-sm">Inactive</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
