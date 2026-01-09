import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

export default function StudentFinesIndex() {
  const { props } = usePage();
  const items = props.items || [];
  const ledger = props.ledger || { totalOutstanding: 0, totalIssued: 0, totalPaidWaived: 0 };
  const initialStatus = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('status')) || '';
  const [showOutstanding, setShowOutstanding] = React.useState(initialStatus ? initialStatus === 'unpaid' : true);
  const outstanding = items.filter((it) => it.status === 'unpaid');
  const history = items.filter((it) => it.status !== 'unpaid');
  const filteredHistory = initialStatus && initialStatus !== 'unpaid' ? history.filter((it) => it.status === initialStatus) : history;

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">My Fines</h2>}>
      <Head title="My Fines" />
      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Ledger</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-600">Total Outstanding</div>
                <div className="text-2xl font-semibold">RM {Number(ledger.totalOutstanding || 0).toFixed(2)}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-600">Total Fines Issued</div>
                <div className="text-2xl font-semibold">RM {Number(ledger.totalIssued || 0).toFixed(2)}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-sm text-gray-600">Total Paid / Waived</div>
                <div className="text-2xl font-semibold">RM {Number(ledger.totalPaidWaived || 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setShowOutstanding(true)} className={`px-3 py-1 rounded ${showOutstanding ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Outstanding</button>
              <button onClick={() => setShowOutstanding(false)} className={`px-3 py-1 rounded ${!showOutstanding ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>History</button>
            </div>
            <div className="divide-y">
              {(showOutstanding ? outstanding : filteredHistory).map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.fine_code} — RM {Number(it.amount_rm).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{it.category} • Due {new Date(it.due_date).toLocaleDateString()} • <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{it.status}</span></div>
                  </div>
                  <Link href={route('student.fines.show', it.id)} className="text-indigo-600 hover:underline">View</Link>
                </div>
              ))}
              {(showOutstanding ? outstanding : filteredHistory).length === 0 && <p className="text-sm text-gray-600">No {showOutstanding ? 'outstanding' : 'matching'} fines.</p>}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
