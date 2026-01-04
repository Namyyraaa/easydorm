import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

export default function StudentFinesIndex() {
  const { props } = usePage();
  const items = props.items || [];
  const [showOutstanding, setShowOutstanding] = React.useState(true);
  const outstanding = items.filter((it) => it.status === 'unpaid');
  const history = items.filter((it) => it.status !== 'unpaid');

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">My Fines</h2>}>
      <Head title="My Fines" />
      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setShowOutstanding(true)} className={`px-3 py-1 rounded ${showOutstanding ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Outstanding</button>
              <button onClick={() => setShowOutstanding(false)} className={`px-3 py-1 rounded ${!showOutstanding ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>History</button>
            </div>
            <div className="divide-y">
              {(showOutstanding ? outstanding : history).map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.fine_code} — RM {Number(it.amount_rm).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{it.category} • Due {new Date(it.due_date).toLocaleDateString()} • <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{it.status}</span></div>
                  </div>
                  <Link href={route('student.fines.show', it.id)} className="text-indigo-600 hover:underline">View</Link>
                </div>
              ))}
              {(showOutstanding ? outstanding : history).length === 0 && <p className="text-sm text-gray-600">No {showOutstanding ? 'outstanding' : 'past'} fines.</p>}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
