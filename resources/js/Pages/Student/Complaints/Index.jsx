import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import React, { useState } from 'react';

export default function ComplaintsIndex() {
  const { props } = usePage();
  const items = props.items || [];
  const flash = props.flash || {};

  const form = useForm({ title: '', description: '', is_anonymous: false, images: [] });
  const [previews, setPreviews] = useState([]);

  const onImagesChange = (files) => {
    const arr = Array.from(files || []);
    if (arr.length > 10) {
      alert('Maximum 10 images');
      return;
    }
    form.setData('images', arr);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const submit = (e) => {
    e.preventDefault();
    form.post(route('student.complaints.store'), {
      forceFormData: true,
      onSuccess: () => {
        setPreviews([]);
        form.reset('title', 'description', 'is_anonymous', 'images');
      },
    });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Complaints</h2>}>
      <Head title="Complaints" />

      <div className="py-12 space-y-6">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}

        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">New Complaint</h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input className="mt-1 w-full border rounded p-2" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                {form.errors.title && <p className="text-sm text-red-600">{form.errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea className="mt-1 w-full border rounded p-2" rows={5} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                {form.errors.description && <p className="text-sm text-red-600">{form.errors.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input id="is_anonymous" type="checkbox" checked={!!form.data.is_anonymous} onChange={(e) => form.setData('is_anonymous', e.target.checked)} />
                <label htmlFor="is_anonymous" className="text-sm">Submit as anonymous</label>
              </div>
              <div>
                <label className="block text-sm font-medium">Images (up to 10, 5MB each)</label>
                <input type="file" accept="image/*" multiple className="mt-1 w-full" onChange={(e) => onImagesChange(e.target.files)} />
                {form.errors['images.*'] && <p className="text-sm text-red-600">{form.errors['images.*']}</p>}
                {previews.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {previews.map((src, idx) => (
                      <img src={src} key={idx} alt="preview" className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Submit</button>
            </form>
          </div>

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="font-semibold mb-3">My Complaints</h3>
            <div className="divide-y">
              {items.map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-gray-600">{new Date(it.created_at).toLocaleString()} — <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 rounded">{it.status}</span></div>
                  </div>
                  <Link href={route('student.complaints.show', it.id)} className="text-indigo-600 hover:underline">View</Link>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-gray-600">No complaints yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
