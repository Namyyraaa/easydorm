import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import VisitorLists from './VisitorLists';
import RegisterVisitorForm from './RegisterVisitorForm';

export default function VisitorsIndex() {
  const { props } = usePage();
  const flash = props.flash || {};
  const tab = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) || 'add';

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Visitors</h2>}>
      <Head title="Visitors" />
      <div className="py-12 space-y-8">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-7xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {tab === 'list' ? (
            <VisitorLists />
          ) : (
            <RegisterVisitorForm />
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
