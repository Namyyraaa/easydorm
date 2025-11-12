import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Catalog() {
    const { props } = usePage();
    const { categories, flash } = props;
    const { data, setData, post, patch, processing, reset } = useForm({ name: '' });
    const renameForm = useForm({ name: '' });
    const [editingId, setEditingId] = useState(null);

    function submit(e) {
        e.preventDefault();
        post(route('admin.inventory.categories.store'), {
            onSuccess: () => reset('name')
        });
    }

    function toggle(id) {
        patch(route('admin.inventory.categories.toggle', id), { preserveScroll: true });
    }

    function startEdit(cat) {
        setEditingId(cat.id);
        renameForm.setData('name', cat.name);
    }

    function cancelEdit() {
        setEditingId(null);
        renameForm.reset('name');
    }

    function saveEdit(e) {
        e.preventDefault();
        if (!editingId) return;
        renameForm.patch(route('admin.inventory.categories.update', editingId), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                renameForm.reset('name');
            }
        });
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory Categories</h2>}>
            <Head title="Inventory Categories" />
            <div className="py-8 max-w-5xl mx-auto space-y-8">
                {flash?.success && <div className="p-3 bg-green-100 text-green-700 rounded">{flash.success}</div>}
                {flash?.error && <div className="p-3 bg-red-100 text-red-700 rounded">{flash.error}</div>}

                <form onSubmit={submit} className="bg-white p-4 rounded shadow flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input className="w-full border rounded px-3 py-2" value={data.name} onChange={e => setData('name', e.target.value)} required />
                    </div>
                    <button disabled={processing} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">Add</button>
                </form>

                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories?.map(cat => (
                                <tr key={cat.id}>
                                    <td className="px-4 py-2 text-sm">
                                        {editingId === cat.id ? (
                                            <form onSubmit={saveEdit} className="flex items-center gap-2">
                                                <input
                                                    className="border rounded px-2 py-1 text-sm"
                                                    value={renameForm.data.name}
                                                    onChange={e => renameForm.setData('name', e.target.value)}
                                                    autoFocus
                                                    required
                                                />
                                                <button type="submit" disabled={renameForm.processing} className="text-green-600 hover:underline text-xs">Save</button>
                                                <button type="button" onClick={cancelEdit} className="text-gray-500 hover:underline text-xs">Cancel</button>
                                            </form>
                                        ) : (
                                            <span>{cat.name}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-sm">{cat.is_active ? 'Active' : 'Inactive'}</td>
                                    <td className="px-4 py-2 text-sm text-right space-x-3">
                                        <button onClick={() => toggle(cat.id)} className="text-indigo-600 hover:underline text-sm">Toggle</button>
                                        {editingId !== cat.id && (
                                            <button onClick={() => startEdit(cat)} className="text-gray-700 hover:underline text-sm">Rename</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(!categories || categories.length === 0) && (
                                <tr><td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={3}>No categories yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
