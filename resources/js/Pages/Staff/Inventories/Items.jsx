import { useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Items() {
    const { props } = usePage();
    const { items, categories, flash, dorm } = props;

    const form = useForm({
        name: '',
        sku: '',
        category_id: '',
        type: 'durable',
        initial_quantity: 0,
        is_active: true,
    });

    function submit(e) {
        e.preventDefault();
        form.post(route('staff.inventory.items.store'), {
            onSuccess: () => form.reset('name', 'sku')
        });
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory Items {dorm ? `— ${dorm.name}` : ''}</h2>}>
            <Head title="Inventory Items" />
            <div className="py-8 max-w-6xl mx-auto space-y-8">
                {flash?.success && <div className="p-3 bg-green-100 text-green-700 rounded">{flash.success}</div>}
                {flash?.error && <div className="p-3 bg-red-100 text-red-700 rounded">{flash.error}</div>}

                <form onSubmit={submit} className="bg-white p-4 rounded shadow grid grid-cols-6 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input className="w-full border rounded px-3 py-2" value={form.data.name} onChange={e => form.setData('name', e.target.value)} required />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">SKU (optional)</label>
                        <input className="w-full border rounded px-3 py-2" value={form.data.sku} onChange={e => form.setData('sku', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select className="w-full border rounded px-3 py-2" value={form.data.category_id} onChange={e => form.setData('category_id', e.target.value)}>
                            <option value="">— None —</option>
                            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select className="w-full border rounded px-3 py-2" value={form.data.type} onChange={e => form.setData('type', e.target.value)}>
                            <option value="durable">Durable</option>
                            <option value="consumable">Consumable</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Initial Quantity (central)</label>
                        <input type="number" min={0} className="w-full border rounded px-3 py-2" value={form.data.initial_quantity} onChange={e => form.setData('initial_quantity', Number(e.target.value))} />
                    </div>
                    <div className="col-span-6 flex items-center gap-2">
                        <input type="checkbox" checked={form.data.is_active} onChange={e => form.setData('is_active', e.target.checked)} />
                        <span className="text-sm">Active</span>
                        <button disabled={form.processing} className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">Add Item</button>
                    </div>
                </form>

                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Central Remaining</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items?.map(it => (
                                <tr key={it.id}>
                                    <td className="px-4 py-2 text-sm">{it.name}</td>
                                    <td className="px-4 py-2 text-sm">{it.sku || '-'}</td>
                                    <td className="px-4 py-2 text-sm">{it.category?.name || '-'}</td>
                                    <td className="px-4 py-2 text-sm">{it.type}</td>
                                    <td className="px-4 py-2 text-sm">{it.quantity}</td>
                                    <td className="px-4 py-2 text-sm">{it.is_active ? 'Active' : 'Inactive'}</td>
                                </tr>
                            ))}
                            {(!items || items.length === 0) && (
                                <tr><td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={6}>No items yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
