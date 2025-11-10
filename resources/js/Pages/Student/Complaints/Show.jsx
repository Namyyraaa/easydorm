import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import React from 'react';

export default function ComplaintShow() {
  const { props } = usePage();
  const item = props.complaint;
  const threadReadOnly = !!props.threadReadOnly;
  const managerName = props.managerName;

  const commentForm = useForm({ body: '' });

  const submitComment = (e) => {
    e.preventDefault();
    if (threadReadOnly) return;
    commentForm.post(route('student.complaints.comments.store', item.id), {
      onSuccess: () => commentForm.reset('body'),
    });
  };

  const drop = () => {
    if (confirm('Drop this complaint? This will lock further replies.')) {
      router.patch(route('student.complaints.drop', item.id));
    }
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Complaint Detail</h2>}>
      <Head title="Complaint" />
      <div className="py-8">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{item.title}</div>
                <div className="text-sm text-gray-600">Status: <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{item.status}</span></div>
                <div className="text-sm text-gray-600">Managed by: {managerName || 'Unclaimed'}</div>
              </div>
              <div className="flex gap-2">
                <Link href={route('student.complaints.index')} className="px-3 py-2 bg-gray-200 text-gray-800 rounded">Back</Link>
                {!['resolved','dropped'].includes(item.status) && (
                  <button onClick={drop} className="px-3 py-2 bg-red-600 text-white rounded">Drop</button>
                )}
              </div>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-gray-800">{item.description}</div>
            {item.media && item.media.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {item.media.map((m) => (
                  <a href={`/storage/${m.path}`} target="_blank" rel="noreferrer" key={m.id}>
                    <img src={`/storage/${m.path}`} alt={m.original_filename || 'attachment'} className="w-full h-24 object-cover rounded" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">Comments</h3>
            <div className="space-y-3">
              {item.comments && item.comments.map((c) => (
                <div key={c.id} className="border rounded p-3">
                  <div className="text-sm text-gray-600 mb-1">{c.user?.name || 'You'} — {new Date(c.created_at).toLocaleString()}</div>
                  <div className="whitespace-pre-wrap">{c.body}</div>
                </div>
              ))}
              {(!item.comments || item.comments.length === 0) && <p className="text-sm text-gray-600">No comments yet.</p>}
            </div>

            {!threadReadOnly && (
              <form onSubmit={submitComment} className="mt-4 space-y-2">
                <textarea className="w-full border rounded p-2" rows={3} value={commentForm.data.body} onChange={(e) => commentForm.setData('body', e.target.value)} />
                {commentForm.errors.body && <p className="text-sm text-red-600">{commentForm.errors.body}</p>}
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Reply</button>
              </form>
            )}
            {threadReadOnly && (
              <p className="text-sm text-gray-600 mt-3">Thread is read-only (resolved or dropped).</p>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
