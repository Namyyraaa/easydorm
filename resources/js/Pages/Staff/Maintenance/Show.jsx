import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import MaintenanceStatusTimeline from '@/Components/MaintenanceStatusTimeline';

export default function StaffMaintenanceShow() {
  const { props } = usePage();
  const item = props.requestItem || {};
  const flash = props.flash || {};

  const statusOrder = ['submitted','reviewed','in_progress','completed'];
  const index = statusOrder.indexOf(item.status);
  const expectedNext = index >= 0 && index < statusOrder.length - 1 ? statusOrder[index + 1] : null;
  const previousStatus = index > 0 ? statusOrder[index - 1] : null;
  const canAdvanceToInProgress = item.status === 'reviewed';
  const canAdvanceToCompleted = item.status === 'in_progress';

  const [submitting, setSubmitting] = useState(false);

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

  const formatManager = (value) => {
    if (!value) return '—';
    if (typeof value === 'object') {
      if (value.name) return value.name;
      return '—';
    }
    if (typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0)) {
      return `User #${value}`;
    }
    return '—';
  };

  const updateStatus = (to) => {
    if (to !== expectedNext || submitting) return;
    setSubmitting(true);
    router.patch(route('staff.maintenance.updateStatus', item.id), { status: to }, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => setSubmitting(false),
    });
  };

  const revert = () => {
    if (!previousStatus || submitting) return;
    setSubmitting(true);
    router.patch(route('staff.maintenance.revertStatus', item.id), {}, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Maintenance Detail</h2>}>
      <Head title={`Maintenance #${item.id}`} />
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
          {(flash.success || flash.error) && (
            <div className={`${flash.error ? 'text-red-800 bg-red-100 border border-red-200' : 'text-green-800 bg-green-100 border border-green-200'} rounded p-3`}>{flash.error || flash.success}</div>
          )}

          <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">By: {item.student?.name} — Created: {item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p>
              </div>
              <div className={`text-xs uppercase px-3 py-1 rounded ${badgeClassFor(item.status)} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>{humanize(item.status)}</div>
            </div>
            <MaintenanceStatusTimeline status={item.status} timestamps={{
              submitted_at: item.created_at,
              reviewed_at: item.reviewed_at,
              in_progress_at: item.in_progress_at,
              completed_at: item.completed_at,
            }} />
            {item.status !== 'submitted' && (
              <div className="mt-4 p-3 bg-gray-50 rounded border">
                <h4 className="font-medium mb-2">Managed By</h4>
                <div className="space-y-1 text-sm text-gray-800">
                  {item.reviewed_at && (
                    <div>
                      <span className="font-semibold">Reviewed By:</span> {formatManager(item.reviewedBy ?? item.reviewed_by)}
                      <span className="text-gray-600"> — {new Date(item.reviewed_at).toLocaleString()}</span>
                    </div>
                  )}
                  {item.in_progress_at && (
                    <div>
                      <span className="font-semibold">In Progress By:</span> {formatManager(item.inProgressBy ?? item.in_progress_by)}
                      <span className="text-gray-600"> — {new Date(item.in_progress_at).toLocaleString()}</span>
                    </div>
                  )}
                  {item.completed_at && (
                    <div>
                      <span className="font-semibold">Completed By:</span> {formatManager(item.completedBy ?? item.completed_by)}
                      <span className="text-gray-600"> — {new Date(item.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="text-gray-800 whitespace-pre-wrap border-t pt-4">{item.description}</p>

            {item.media?.length > 0 && (
              <div>
                <h4 className="font-medium mt-4 mb-2">Images ({item.media.length})</h4>
                <div className="grid grid-cols-5 gap-2">
                  {item.media.map(m => (
                    <a key={m.id} href={m.path.startsWith('maintenance') ? `/storage/${m.path}` : m.path} target="_blank" rel="noreferrer">
                      <img src={m.path.startsWith('maintenance') ? `/storage/${m.path}` : m.path} alt={m.original_filename} className="w-full h-24 object-cover rounded" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t">
              <button disabled={!canAdvanceToInProgress || submitting} onClick={() => updateStatus('in_progress')} className="px-3 py-1 bg-amber-600 text-white rounded disabled:opacity-50">Mark In Progress</button>
              <button disabled={!canAdvanceToCompleted || submitting} onClick={() => updateStatus('completed')} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50">Mark Completed</button>
              <button type="button" onClick={revert} disabled={submitting || !previousStatus} className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50">Revert</button>
              <Link href={route('staff.maintenance.index')} className="ml-auto px-3 py-1 bg-gray-200 text-gray-800 rounded">Back</Link>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
