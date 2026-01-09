import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import MaintenanceStatusTimeline from '@/Components/MaintenanceStatusTimeline';

export default function MaintenanceShow() {
  const { props } = usePage();
  const item = props.requestItem || {};
  const actorsFromServer = props.actors || {};
  const flash = props.flash || {};
  const userId = props?.auth?.user?.id;
  const isOwner = String(item.student_id) === String(userId);
  const editable = isOwner && ['submitted','reviewed'].includes(item.status);

  const form = useForm({ title: item.title || '', description: item.description || '', add_images: [] });
  const [previews, setPreviews] = useState([]);

  const remainingSlots = 10 - (item.media?.length || 0);

  const onMoreImages = (files) => {
    const arr = Array.from(files || []);
    if (arr.length > remainingSlots) {
      alert(`You can still add ${remainingSlots} image(s).`);
      return;
    }
    form.setData('add_images', arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
  };

  const submit = (e) => {
    e.preventDefault();
    // Use POST with method spoofing to ensure multipart fields are parsed on Laravel/PHP
    form.transform((data) => ({ ...data, _method: 'patch' }));
    form.post(route('student.maintenance.update', item.id), {
      forceFormData: true,
      onSuccess: () => {
        setPreviews([]);
        form.setData('add_images', []);
      },
      onFinish: () => {
        // reset transform to identity for future submits
        form.transform((d) => d);
      },
    });
  };

  const destroy = () => {
    if (!confirm('Delete this maintenance request?')) return;
    router.delete(route('student.maintenance.destroy', item.id));
  };

  const firstTwoWords = (name) => {
    if (!name || typeof name !== 'string') return undefined;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return undefined;
    return parts.slice(0, 2).join(' ');
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Maintenance Request</h2>}>
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
                <p className="text-sm text-gray-600">Created: {item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p>
              </div>
              <div className="text-xs uppercase px-3 py-1 rounded bg-gray-200">{item.status}</div>
            </div>
            <MaintenanceStatusTimeline
              status={item.status}
              timestamps={{
                submitted_at: item.created_at,
                reviewed_at: item.reviewed_at,
                in_progress_at: item.in_progress_at,
                completed_at: item.completed_at,
              }}
              actors={{
                submitted: actorsFromServer.submitted ?? firstTwoWords(item.student?.name),
                reviewed: actorsFromServer.reviewed ?? firstTwoWords(item.reviewedBy?.name),
                in_progress: actorsFromServer.in_progress ?? firstTwoWords(item.inProgressBy?.name),
                completed: actorsFromServer.completed ?? firstTwoWords(item.completedBy?.name),
              }}
            />
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
          </div>

          {editable && (
            <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
              <h3 className="font-semibold mb-2">Edit Request</h3>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Title</label>
                  <input className="mt-1 w-full border rounded p-2" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                  {form.errors.title && <p className="text-sm text-red-600">{form.errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Description</label>
                  <textarea rows={5} className="mt-1 w-full border rounded p-2" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                  {form.errors.description && <p className="text-sm text-red-600">{form.errors.description}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Add Images (remaining {remainingSlots})</label>
                  <input type="file" accept="image/*" multiple disabled={remainingSlots <= 0} onChange={(e) => onMoreImages(e.target.files)} />
                  {form.errors['add_images.*'] && <p className="text-sm text-red-600">{form.errors['add_images.*']}</p>}
                  {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {previews.map((src, idx) => (
                        <img src={src} key={idx} alt="preview" className="w-full h-24 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
                  <button type="button" onClick={destroy} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                  <Link href={route('student.maintenance.index')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Back</Link>
                </div>
              </form>
            </div>
          )}
          {!isOwner && (
            <div className="flex items-center gap-3">
              <Link href={route('student.maintenance.index')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Back</Link>
            </div>
          )}
          {isOwner && !editable && (
            <div className="text-sm text-gray-600">Editing disabled after work started.</div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
