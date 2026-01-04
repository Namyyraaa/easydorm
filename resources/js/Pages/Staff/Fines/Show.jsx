import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import React from 'react';

export default function StaffFinesShow() {
  const { props } = usePage();
  const fine = props.fine || {};
  const categories = props.categories || [];
  const statuses = props.statuses || [];
  const flash = props.flash || {};

  const form = useForm({ amount_rm: fine.amount_rm || '', due_date: (fine.due_date ? fine.due_date.slice(0,10) : ''), status: fine.status || '' });
  const approveForm = useForm({});

  const submit = (e) => {
    e.preventDefault();
    form.patch(route('staff.fines.update', fine.id));
  };

  const approvePayment = (e) => {
    e.preventDefault();
    approveForm.patch(route('staff.fines.approvePayment', fine.id));
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Fine Details</h2>}>
      <Head title={`Fine ${fine.fine_code || ''}`} />
      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
          {(flash.success || flash.error) && (
            <div className={` ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
              {flash.error || flash.success}
            </div>
          )}

          <div className="bg-white shadow sm:rounded-lg p-6 space-y-3">
            <div className="font-semibold">{fine.fine_code}</div>
            <div className="text-sm text-gray-600">Resident: {fine.student?.name}</div>
            <div className="text-sm text-gray-600">Category: {fine.category}</div>
            <div className="text-sm text-gray-600">Offence: {fine.offence_date ? new Date(fine.offence_date).toLocaleDateString() : '-'}</div>
            <div className="text-sm text-gray-600">Issued: {fine.issued_at ? new Date(fine.issued_at).toLocaleString() : '-'}</div>
            <div className="text-sm text-gray-600">Reason: {fine.reason || '-'}</div>
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Update Fine</h3>
            <form onSubmit={submit} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Amount (RM)</label>
                <input className="mt-1 w-full border rounded p-2" type="number" step="0.01" value={form.data.amount_rm} onChange={(e) => form.setData('amount_rm', e.target.value)} />
                {form.errors.amount_rm && <p className="text-sm text-red-600">{form.errors.amount_rm}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Due date</label>
                <input className="mt-1 w-full border rounded p-2" type="date" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} />
                {form.errors.due_date && <p className="text-sm text-red-600">{form.errors.due_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select className="mt-1 w-full border rounded p-2" value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {form.errors.status && <p className="text-sm text-red-600">{form.errors.status}</p>}
              </div>
              <div className="col-span-2">
                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Evidence</h3>
            <div className="grid grid-cols-4 gap-3">
              {(fine.media || []).map((m) => (
                <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                  {m.mime_type?.startsWith('image/') || m.type === 'image' ? (
                    <img src={m.url} alt={m.original_filename || 'evidence'} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="p-3 text-sm">{m.original_filename || 'Attachment'}</div>
                  )}
                </a>
              ))}
              {(fine.media || []).length === 0 && <p className="text-sm text-gray-600">No attachments.</p>}
            </div>
            <div className="mt-4">
              <h4 className="font-medium">Payment Proofs</h4>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {(fine.media || []).filter((m) => m.type === 'payment').map((m) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                    {m.mime_type?.startsWith('image/') ? (
                      <img src={m.url} alt={m.original_filename || 'payment'} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="p-3 text-sm">{m.original_filename || 'Attachment'}</div>
                    )}
                  </a>
                ))}
                {(fine.media || []).filter((m) => m.type === 'payment').length === 0 && <p className="text-sm text-gray-600">No payment proofs submitted.</p>}
              </div>
              {fine.status === 'pending' && (fine.media || []).filter((m) => m.type === 'payment').length > 0 && (
                <form onSubmit={approvePayment} className="mt-3">
                  <button type="submit" disabled={approveForm.processing} className="px-4 py-2 bg-green-600 text-white rounded">Approve Payment (Mark as PAID)</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
