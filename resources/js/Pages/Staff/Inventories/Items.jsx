import { useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function Items() {
    const { props } = usePage();
    const rawItems = props.items || [];
    const items = Array.isArray(rawItems) ? rawItems : (rawItems?.data || []);
    const categories = props.categories || [];
    const flash = props.flash || {};
    const dorm = props.dorm;

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

    // Filters and pagination (match Maintenance/Complaints style)
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const humanize = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const badgeClassFor = (s) => {
        switch (s) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const statusOptions = useMemo(() => {
        const s = new Set(items.map(it => (it.is_active ? 'active' : 'inactive')));
        return ['all', ...Array.from(s)];
    }, [items]);

    const typeOptions = useMemo(() => {
        const t = new Set(items.map(it => it.type).filter(Boolean));
        return ['all', ...Array.from(t)];
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter(it => (
            (statusFilter === 'all' || (it.is_active ? 'active' : 'inactive') === statusFilter) &&
            (typeFilter === 'all' || it.type === typeFilter) &&
            (categoryFilter === 'all' || String(it.category?.id ?? it.category_id) === String(categoryFilter))
        ));
    }, [items, statusFilter, typeFilter, categoryFilter]);

    useEffect(() => { setPage(1); }, [statusFilter, typeFilter, categoryFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const displayItems = useMemo(() => filtered.slice(start, end), [filtered, start, end]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory Items {dorm ? `— ${dorm.name}` : ''}</h2>}>
            <Head title="Inventory Items" />
            <div className="py-12 space-y-6">
                {(flash.success || flash.error) && (
                    <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>{flash.error || flash.success}</div>
                )}

                {/* Add Item Form */}
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
                    <h3 className="font-semibold mb-3">Add Inventory Item</h3>
                    <form onSubmit={submit} className="grid grid-cols-6 gap-4">
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
                </div>

                {/* Items List */}
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
                    <h3 className="font-semibold mb-3">Items</h3>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-3">
                            <div className="flex items-center">
                                <label className="text-sm text-gray-600">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                                >
                                    {statusOptions.map(s => (
                                        <option key={s} value={s}>{s === 'all' ? 'All' : humanize(s)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="text-sm text-gray-600">Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value)}
                                    className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                                >
                                    {typeOptions.map(t => (
                                        <option key={t} value={t}>{t === 'all' ? 'All' : humanize(t)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="text-sm text-gray-600">Category</label>
                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] max-h-60 overflow-y-auto focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                                >
                                    <option value="all">All</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setCategoryFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-600">
                                <th className="py-2 text-left">Name</th>
                                <th className="text-left">SKU</th>
                                <th className="text-left">Category</th>
                                <th className="text-left">Type</th>
                                <th className="text-left">Central Remaining</th>
                                <th className="text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map(it => (
                                <tr key={it.id} className="border-t">
                                    <td className="py-2">{it.name}</td>
                                    <td>{it.sku || '-'}</td>
                                    <td>{it.category?.name || '-'}</td>
                                    <td>{humanize(it.type)}</td>
                                    <td>{it.quantity}</td>
                                    <td>
                                        <span className={`uppercase text-xs px-2 py-0.5 rounded ${badgeClassFor(it.is_active ? 'active' : 'inactive')}`}>
                                            {(it.is_active ? 'active' : 'inactive')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {displayItems.length === 0 && (
                                <tr><td colSpan="6" className="py-3 text-gray-600">{items.length === 0 ? 'No items yet.' : 'No matching items.'}</td></tr>
                            )}
                        </tbody>
                    </table>

                    {filtered.length > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filtered.length)} of {filtered.length}</div>
                            <div className="flex items-center gap-1">
                                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${page === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                                ))}
                                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
