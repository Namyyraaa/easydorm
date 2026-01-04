import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import React from 'react';

export default function StudentFinesShow() {
  const { props } = usePage();
  const fine = props.fine || {};
  const form = useForm({ reason: '', attachments: [] });
  const [previews, setPreviews] = React.useState([]);
  const payForm = useForm({ proof: null });
  const [payPreview, setPayPreview] = React.useState(null);

  const onAttachmentsChange = (files) => {
    const arr = Array.from(files || []);
    if (arr.length > 10) { alert('Maximum 10 files'); return; }
    form.setData('attachments', arr);
    const urls = arr.filter(f => f.type.startsWith('image/')).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const submitAppeal = (e) => {
    e.preventDefault();
    form.post(route('student.fines.appeal', fine.id), { forceFormData: true, onSuccess: () => { form.reset('reason','attachments'); setPreviews([]); } });
  };

  const onProofChange = (file) => {
    const f = file?.[0] || null;
    payForm.setData('proof', f);
    setPayPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  };

  const submitPaymentProof = (e) => {
    e.preventDefault();
    if (!payForm.data.proof) { alert('Please select a file'); return; }
    payForm.post(route('student.fines.paymentProof', fine.id), { forceFormData: true, onSuccess: () => { payForm.reset('proof'); setPayPreview(null); } });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Fine Details</h2>}>
      <Head title={`Fine ${fine.fine_code || ''}`} />
      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6 space-y-3">
            <div className="font-semibold">{fine.fine_code}</div>
            <div className="text-sm text-gray-600">Category: {fine.category}</div>
            <div className="text-sm text-gray-600">Amount: RM {Number(fine.amount_rm || 0).toFixed(2)}</div>
            <div className="text-sm text-gray-600">Status: <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{fine.status}</span></div>
            <div className="text-sm text-gray-600">Due: {fine.due_date ? new Date(fine.due_date).toLocaleDateString() : '-'}</div>
            <div className="text-sm text-gray-600">Reason: {fine.reason || '-'}</div>
            <div className="text-sm text-gray-600">Issued by: {fine.issuer?.user?.name}</div>
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
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Payment Proof</h3>
            <form onSubmit={submitPaymentProof} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Upload proof (image or PDF)</label>
                <input type="file" accept="image/*,application/pdf" className="mt-1 w-full" onChange={(e) => onProofChange(e.target.files)} />
                {payForm.errors.proof && <p className="text-sm text-red-600">{payForm.errors.proof}</p>}
                {payPreview && (
                  <div className="mt-3">
                    <img src={payPreview} alt="preview" className="w-40 h-40 object-cover rounded border" />
                  </div>
                )}
              </div>
              <button type="submit" disabled={payForm.processing} className="px-4 py-2 bg-green-600 text-white rounded">Submit Payment Proof</button>
            </form>

            <div className="mt-4">
              <h4 className="font-medium">Submitted Proofs</h4>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {(fine.media || []).filter((m) => m.type === 'payment').map((m) => (
                  <a key={m.id} href={m.url ?? ('/storage/'+m.path)} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                    {m.mime_type?.startsWith('image/') ? (
                      <img src={m.url ?? ('/storage/'+m.path)} alt={m.original_filename || 'payment'} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="p-3 text-sm">{m.original_filename || 'Attachment'}</div>
                    )}
                  </a>
                ))}
                {(fine.media || []).filter((m) => m.type === 'payment').length === 0 && <p className="text-sm text-gray-600">No payment proofs yet.</p>}
              </div>
            </div>
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Appeals</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Submit Appeal</h4>
                <form onSubmit={submitAppeal} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium">Appeal Reason</label>
                    <textarea className="mt-1 w-full border rounded p-2" rows={4} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                    {form.errors.reason && <p className="text-sm text-red-600">{form.errors.reason}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Attachments (images or PDF)</label>
                    <input type="file" accept="image/*,application/pdf" multiple className="mt-1 w-full" onChange={(e) => onAttachmentsChange(e.target.files)} />
                    {form.errors['attachments.*'] && <p className="text-sm text-red-600">{form.errors['attachments.*']}</p>}
                    {previews.length > 0 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {previews.map((src, idx) => (
                          <img src={src} key={idx} alt="preview" className="w-full h-24 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Submit Appeal</button>
                </form>
              </div>

              <div>
                <h4 className="font-medium">Appeal History</h4>
                <div className="divide-y">
                  {(fine.appeals || []).map((a) => (
                    <div key={a.id} className="py-3">
                      <div className="text-sm">Status: <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{a.status}</span> — Submitted {new Date(a.submitted_at).toLocaleString()}</div>
                      {a.decided_at && <div className="text-sm text-gray-600">Decided: {new Date(a.decided_at).toLocaleString()} — {a.decision_reason || ''}</div>}
                      {(a.media || []).length > 0 && (
                        <div className="mt-2 grid grid-cols-5 gap-2">
                          {a.media.map((m) => (
                            <a key={m.id} href={('/storage/'+m.path)} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                              {m.mime_type?.startsWith('image/') || m.type === 'image' ? (
                                <img src={('/storage/'+m.path)} alt={m.original_filename || 'attachment'} className="w-full h-20 object-cover" />
                              ) : (
                                <div className="p-2 text-xs">{m.original_filename || 'Attachment'}</div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(fine.appeals || []).length === 0 && <p className="text-sm text-gray-600">No appeals yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
