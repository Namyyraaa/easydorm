import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import MaintenanceStatusTimeline from '@/Components/MaintenanceStatusTimeline';

export default function StaffComplaintShow() {
  const { props } = usePage();
  const complaint = props.complaint;
  const isManaging = !!props.isManaging;
  const managerName = props.managerName;
  const studentName = props.studentName;

  const commentForm = useForm({ body: '' });
  const [submitting, setSubmitting] = useState(false);

  const claim = () => {
    router.patch(route('staff.complaints.claim', complaint.id));
  };

  const updateStatus = (next) => {
    if (!isManaging || submitting) return;
    const order = ['submitted','reviewed','in_progress','resolved'];
    const idx = order.indexOf(complaint.status);
    const expected = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
    if (!next || next !== expected) return;
    setSubmitting(true);
    router.patch(route('staff.complaints.updateStatus', complaint.id), { status: next }, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => setSubmitting(false),
    });
  };

  const submitComment = (e) => {
    e.preventDefault();
    commentForm.post(route('staff.complaints.comments.store', complaint.id), {
      onSuccess: () => commentForm.reset('body'),
    });
  };

  const nextStatus = () => {
    const order = ['submitted','reviewed','in_progress','resolved'];
    const idx = order.indexOf(complaint.status);
    if (idx === -1 || idx === order.length - 1) return null;
    return order[idx + 1];
  };

  const canAdvance = isManaging && ['submitted','reviewed','in_progress'].includes(complaint.status);
  const advanceTo = nextStatus();
  const threadReadOnly = ['resolved','dropped'].includes(complaint.status);
  const previousStatus = (() => {
    if (!isManaging) return null;
    if (complaint.status === 'resolved') return 'in_progress';
    if (complaint.status === 'in_progress') return 'reviewed';
    return null;
  })();

  const revert = () => {
    if (!previousStatus || submitting) return;
    setSubmitting(true);
    router.patch(route('staff.complaints.revertStatus', complaint.id), {}, {
      preserveScroll: true,
      preserveState: false,
      onFinish: () => setSubmitting(false),
    });
  };

  const formatTS = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Complaint</h2>}>
      <Head title="Complaint" />
      <div className="py-8">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
            <div className="flex items-center">
              <div>
                <div className="text-lg font-semibold">{complaint.title}</div>
                <div className="text-sm text-gray-600">By: {studentName || '—'} — Submitted at: {formatTS(complaint.created_at)}</div>
              </div>
              <div className={`ml-auto text-xs uppercase px-3 py-1 rounded ${(() => {
                switch (complaint.status) {
                  case 'submitted': return 'bg-gray-100 text-gray-800';
                  case 'reviewed': return 'bg-sky-100 text-sky-800';
                  case 'in_progress': return 'bg-amber-100 text-amber-800';
                  case 'resolved': return 'bg-green-100 text-green-800';
                  case 'dropped': return 'bg-red-100 text-red-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              })()} transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1`}>
                {(complaint.status || '').replace(/_/g,' ')}
              </div>
              {!isManaging && !complaint.managed_by_staff_id && (
                <button onClick={claim} className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded">Claim</button>
              )}
            </div>
            <MaintenanceStatusTimeline
              status={complaint.status}
              steps={[
                { key: 'reviewed', label: 'Reviewed' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'resolved', label: 'Resolved' },
              ]}
              timestamps={{
                reviewed_at: complaint.reviewed_at,
                in_progress_at: complaint.in_progress_at,
                resolved_at: complaint.resolved_at,
              }}
              actors={{
                reviewed: managerName,
                in_progress: managerName,
                resolved: managerName,
              }}
            />

            <div className="mt-4 whitespace-pre-wrap text-gray-800">{complaint.description}</div>
            {complaint.media && complaint.media.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {complaint.media.map((m) => (
                  <a href={`/storage/${m.path}`} target="_blank" rel="noreferrer" key={m.id}>
                    <img src={`/storage/${m.path}`} alt={m.original_filename || 'attachment'} className="w-full h-24 object-cover rounded" />
                  </a>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 pt-4 border-t">
              {canAdvance && advanceTo && (
                <button
                  disabled={submitting}
                  onClick={() => updateStatus(advanceTo)}
                  className={`px-3 py-1 ${advanceTo === 'in_progress' ? 'bg-amber-600' : 'bg-green-600'} text-white rounded disabled:opacity-50`}
                >
                  {advanceTo === 'in_progress' ? (submitting ? 'Updating...' : 'Mark as In Progress') : (submitting ? 'Updating...' : `Mark as ${advanceTo.replace('_',' ')}`)}
                </button>
              )}
              {previousStatus && (
                <button
                  disabled={submitting}
                  onClick={revert}
                  className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
                >
                  {submitting ? 'Reverting...' : 'Revert'}
                </button>
              )}
              <Link href={route('staff.complaints.index')} className="ml-auto px-3 py-1 bg-gray-200 text-gray-800 rounded">Back</Link>
            </div>
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Comments</h3>
            {!isManaging && complaint.managed_by_staff_id && (
              <p className="text-sm text-gray-600">This complaint is managed by another staff member. Thread hidden.</p>
            )}
            {isManaging && (
              <>
                <div className="space-y-3">
                  {complaint.comments && complaint.comments.map((c) => (
                    <div key={c.id} className="border rounded p-3">
                      <div className="text-sm text-gray-600 mb-1">{c.user?.name || 'User'} — {new Date(c.created_at).toLocaleString()}</div>
                      <div className="whitespace-pre-wrap">{c.body}</div>
                    </div>
                  ))}
                  {(!complaint.comments || complaint.comments.length === 0) && <p className="text-sm text-gray-600">No comments yet.</p>}
                </div>
                {!threadReadOnly && (
                  <form onSubmit={submitComment} className="mt-4 space-y-2">
                    <textarea className="w-full border rounded p-2" rows={3} value={commentForm.data.body} onChange={(e) => commentForm.setData('body', e.target.value)} />
                    {commentForm.errors.body && <p className="text-sm text-red-600">{commentForm.errors.body}</p>}
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Reply</button>
                  </form>
                )}
                {threadReadOnly && (
                  <p className="text-sm text-gray-600 mt-3">Thread is read-only.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
