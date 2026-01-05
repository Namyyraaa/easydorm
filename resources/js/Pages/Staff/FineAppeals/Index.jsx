import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';

export default function StaffFineAppealsIndex() {
  const { props } = usePage();
  const items = props.items || [];
  const students = props.students || [];
  const statuses = props.statuses || [];

  const filterForm = useForm({ student_id: props.filters?.student_id || '', status: props.filters?.status || '' });

  const applyFilters = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filterForm.data).forEach(([k,v]) => { if (v) params.set(k, v); });
    const url = route('staff.fineAppeals.index') + (params.toString() ? ('?'+params.toString()) : '');
    window.location.href = url;
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Fine Appeals</h2>}>
      <Head title="Fine Appeals" />
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
          <h3 className="font-semibold mb-3">Appeals</h3>
          <form onSubmit={applyFilters} className="grid grid-cols-3 gap-3 mb-4">
            <select className="border rounded p-2" value={filterForm.data.student_id} onChange={(e) => filterForm.setData('student_id', e.target.value)}>
              <option value="">All students</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} (ID {s.id})</option>)}
            </select>
            <select className="border rounded p-2" value={filterForm.data.status} onChange={(e) => filterForm.setData('status', e.target.value)}>
              <option value="">All statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="submit" className="px-3 py-2 bg-gray-100 rounded">Apply Filters</button>
          </form>

          <div className="divide-y">
            {items.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{it.fine?.fine_code} — {it.student?.name}</div>
                  <div className="text-sm text-gray-600">Status: <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{it.status}</span> • Submitted {it.submitted_at ? new Date(it.submitted_at).toLocaleString() : '-'}</div>
                </div>
                <Link href={route('staff.fineAppeals.show', it.id)} className="text-indigo-600 hover:underline">Review</Link>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-gray-600">No appeals found.</p>}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
