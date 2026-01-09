import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';

export default function StaffFineAppealShow() {
  const { props } = usePage();
  const appeal = props.appeal;

  const decideForm = useForm({ decision: 'approved', decision_reason: '' });

  const submitDecision = (e) => {
    e.preventDefault();
    decideForm.patch(route('staff.fineAppeals.decide', appeal.id), { preserveScroll: true });
  };

  const fine = appeal?.fine;
  const student = appeal?.student;

  const fineEvidences = fine?.evidences || [];
  const paymentProofs = fine?.paymentProofs || [];
  const appealMedia = appeal?.media || [];

  const fmtDate = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '-'; }
  };
  const fmtDateTime = (d) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '-'; }
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Fine Appeal — {fine?.fine_code}</h2>}>
      <Head title={`Fine Appeal ${fine?.fine_code || ''}`} />
      <div className="py-12 space-y-6">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fine Details */}
          <div className="bg-white shadow sm:rounded-lg p-6 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-lg">{fine?.fine_code} • <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{fine?.status}</span></div>
                <div className="mt-1 text-sm text-gray-700">{student?.name} • Category: {fine?.category} • Amount: RM {Number(fine?.amount_rm || 0).toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Due {fmtDate(fine?.due_date)} • Issued {fmtDateTime(fine?.issued_at)}</div>
              </div>
              <Link href={route('staff.fines.show', fine?.id)} className="inline-flex items-center px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">View Fine</Link>
            </div>

            {/* Fine evidences */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Fine Evidence</h4>
              {fineEvidences.length === 0 && <p className="text-sm text-gray-600">No evidence uploaded.</p>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fineEvidences.map((m) => (
                  <div key={m.id} className="border rounded p-2">
                    {m.mime_type?.startsWith('image/') ? (
                      <img src={m.url} alt={m.original_filename} className="w-full h-40 object-cover rounded" />
                    ) : (
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">{m.original_filename || 'File'}</a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment proofs */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Payment Proofs</h4>
              {paymentProofs.length === 0 && <p className="text-sm text-gray-600">No payment proofs.</p>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentProofs.map((m) => (
                  <div key={m.id} className="border rounded p-2">
                    {m.mime_type?.startsWith('image/') ? (
                      <img src={m.url} alt={m.original_filename} className="w-full h-40 object-cover rounded" />
                    ) : (
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">{m.original_filename || 'File'}</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decision */}
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Decision</h3>
            {appeal.status === 'pending' ? (
              <form onSubmit={submitDecision} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center space-x-2">
                    <input type="radio" name="decision" value="approved" checked={decideForm.data.decision === 'approved'} onChange={(e) => decideForm.setData('decision', e.target.value)} />
                    <span>Approve (Fine will be waived)</span>
                  </label>
                  <label className="inline-flex items-center space-x-2">
                    <input type="radio" name="decision" value="rejected" checked={decideForm.data.decision === 'rejected'} onChange={(e) => decideForm.setData('decision', e.target.value)} />
                    <span>Reject (Status unchanged)</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium">Decision Remarks</label>
                  <textarea className="mt-1 w-full border rounded p-2" rows={4} value={decideForm.data.decision_reason} onChange={(e) => decideForm.setData('decision_reason', e.target.value)} />
                  {decideForm.errors.decision_reason && <p className="text-sm text-red-600">{decideForm.errors.decision_reason}</p>}
                </div>
                <button type="submit" disabled={decideForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Submit Decision</button>
              </form>
            ) : (
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  Status: <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{appeal.status}</span>
                </div>
                <div>
                  Decided {fmtDateTime(appeal.decided_at)}
                </div>
                {appeal.decision_reason && (
                  <div>
                    <h5 className="font-medium mb-1">Decision Remarks</h5>
                    <div className="text-sm text-gray-700 whitespace-pre-line border rounded p-3 bg-gray-50">{appeal.decision_reason}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Appeal Submission Details (separate box) */}
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-2">Appeal Submission</h3>
            <div className="mb-2 text-sm"><span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{appeal.status}</span> • Submitted {fmtDateTime(appeal.submitted_at)}</div>
            <div className="whitespace-pre-line border rounded p-3 bg-gray-50 text-sm">{appeal.reason}</div>
            <div className="mt-3">
              <h5 className="font-medium mb-1">Appeal Attachments</h5>
              {appealMedia.length === 0 && <p className="text-sm text-gray-600">No attachments.</p>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {appealMedia.map((m) => (
                  <div key={m.id} className="border rounded p-2">
                    {m.mime_type?.startsWith('image/') ? (
                      <img src={m.url} alt={m.original_filename} className="w-full h-40 object-cover rounded" />
                    ) : (
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">{m.original_filename || 'File'}</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
