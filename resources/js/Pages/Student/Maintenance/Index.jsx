import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function MaintenanceIndex() {
  const { props } = usePage();
  const items = props.requests || [];
  const roommateItems = props.roommateRequests || [];
  const flash = props.flash || {};

  const form = useForm({ title: '', description: '', images: [] });
  const [previews, setPreviews] = useState([]);

  // Tabs: mirror Staff Fines pattern (persist active tab via URL ?tab=...)
  const initialTabParam = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab')) || 'list';
  const [activeTab, setActiveTab] = useState(initialTabParam === 'list' ? 'list' : 'form');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url);
  }, [activeTab]);

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

  const badgeClassForStatus = (s) => {
    switch (s) {
      case 'submitted':
        return 'bg-sky-100 text-sky-800';
      case 'reviewed':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const submit = (e) => {
    e.preventDefault();
    form.post(route('student.maintenance.store'), {
      forceFormData: true,
      preserveState: false,
      preserveScroll: true,
      onSuccess: () => {
        setPreviews([]);
        form.reset('title', 'description', 'images');
        setActiveTab('list');
      },
    });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Maintenance Requests</h2>}>
      <Head title="Maintenance" />

      <div className="py-12 space-y-6">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          {/* Tabs header: match Staff Fines underline style */}
          <div className="border-b border-violet-200 mb-6">
            <nav className="-mb-px flex w-full" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-2 ${activeTab === 'form' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                New Request
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center order-1 ${activeTab === 'list' ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
              >
                My Requests
              </button>
            </nav>
          </div>

          {/* Tabs content */}
          {activeTab === 'list' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="font-semibold mb-3">My Requests</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="py-2 text-left">Title</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Status</th>
                    <th className="text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="py-2">{it.title}</td>
                      <td>{it.created_at ? new Date(it.created_at).toLocaleDateString() : ''}</td>
                      <td><span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassForStatus(it.status)}`}>{it.status}</span></td>
                      <td>
                        <Link href={route('student.maintenance.show', it.id)} className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1">View</Link>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-3 text-gray-600">No maintenance requests yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Roommate-visible requests (read-only) */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Requests from Roommates (read-only)</h3>
                  <div className="divide-y">
                    {roommateItems.map((it) => (
                      <div key={it.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{it.title}</div>
                          <div className="text-sm text-gray-600">{new Date(it.created_at).toLocaleString()} — <span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassForStatus(it.status)}`}>{it.status}</span></div>
                        </div>
                        <Link href={route('student.maintenance.show', it.id)} className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1">View</Link>
                      </div>
                    ))}
                  {roommateItems.length === 0 && <p className="text-sm text-gray-600">No roommate requests visible.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'form' && (
            <div className="overflow-hidden rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
                <h3 className="font-semibold mb-3">New Request</h3>
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
                  <div>
                    <label className="block text-sm font-medium">Images (up to 10, 5MB each)</label>
                    <input id="maintenance-images" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onImagesChange(e.target.files)} />
                    <label htmlFor="maintenance-images" className="mt-1 inline-flex items-center rounded-lg border border-violet-300 bg-white px-4 py-2 text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer">Choose files</label>
                    <p className="mt-1 text-xs text-gray-500">You can select up to 10 images (max 5MB each).</p>
                    {form.errors['images.*'] && <p className="text-sm text-red-600">{form.errors['images.*']}</p>}
                    {previews.length > 0 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {previews.map((src, idx) => (
                          <img src={src} key={idx} alt="preview" className="w-full h-24 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">{form.processing ? 'Submitting...' : 'Submit'}</button>
                </form>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
