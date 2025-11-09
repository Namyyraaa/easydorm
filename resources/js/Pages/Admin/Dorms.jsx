import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';

export default function Dorms() {
    const { props } = usePage();
    const dorms = props.dorms || [];
    const users = props.users || [];
    const staffList = props.staffList || [];
    const flash = props.flash || {};

    const { data, setData, post, processing, reset, errors } = useForm({
        code: '',
        name: '',
        address: '',
    });

    const assignForm = useForm({ user_id: '', dorm_id: '' });
    const bulkForm = useForm({ user_ids: [], dorm_id: '' });
    const [revokingId, setRevokingId] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.dorms.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dorms</h2>}
        >
            <Head title="Dorms" />
            <div className="py-12 space-y-8">
                {(flash.success || flash.error) && (
                    <div className={`mx-auto max-w-7xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
                        {flash.error || flash.success}
                    </div>
                )}
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Add Dorm</h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Code</label>
                                <input className="mt-1 w-full border rounded p-2" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                                {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Name</label>
                                <input className="mt-1 w-full border rounded p-2" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Address</label>
                                <textarea className="mt-1 w-full border rounded p-2" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                                {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                            </div>
                            <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
                        </form>
                    </div>
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Existing Dorms</h3>
                        <ul className="divide-y">
                            {dorms.map((d) => (
                                <li key={d.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{d.name} <span className="text-gray-500">({d.code})</span></div>
                                        <div className="text-sm text-gray-600">Staff: {d.staff_count}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="px-3 py-1 text-sm bg-slate-700 text-white rounded"
                                            onClick={() => router.get(route('admin.dorms.manage', d.id))}
                                        >
                                            Manage
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Assign Staff (Single)</h3>
                        <form onSubmit={(e) => { e.preventDefault(); assignForm.post(route('admin.dorms.assignStaff')); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">User</label>
                                <select className="mt-1 w-full border rounded p-2" value={assignForm.data.user_id} onChange={(e) => assignForm.setData('user_id', e.target.value)}>
                                    <option value="">Select user</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                </select>
                                {assignForm.errors.user_id && <p className="text-sm text-red-600">{assignForm.errors.user_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Dorm</label>
                                <select className="mt-1 w-full border rounded p-2" value={assignForm.data.dorm_id} onChange={(e) => assignForm.setData('dorm_id', e.target.value)}>
                                    <option value="">Select dorm</option>
                                    {dorms.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                </select>
                                {assignForm.errors.dorm_id && <p className="text-sm text-red-600">{assignForm.errors.dorm_id}</p>}
                            </div>
                            <button type="submit" disabled={assignForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Assign</button>
                        </form>
                    </div>
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Assign Staff (Bulk)</h3>
                        <form onSubmit={(e) => { e.preventDefault(); bulkForm.post(route('admin.dorms.assignStaffBulk')); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Users</label>
                                <div className="max-h-56 overflow-auto border rounded p-2 space-y-1">
                                    {users.map(u => (
                                        <label key={u.id} className="flex items-center gap-2">
                                            <input type="checkbox" checked={bulkForm.data.user_ids.includes(u.id)} onChange={(e) => {
                                                const checked = e.target.checked;
                                                bulkForm.setData('user_ids', checked ? [...bulkForm.data.user_ids, u.id] : bulkForm.data.user_ids.filter(id => id !== u.id));
                                            }} />
                                            <span>{u.name} ({u.email})</span>
                                        </label>
                                    ))}
                                </div>
                                {bulkForm.errors.user_ids && <p className="text-sm text-red-600">{bulkForm.errors.user_ids}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Dorm</label>
                                <select className="mt-1 w-full border rounded p-2" value={bulkForm.data.dorm_id} onChange={(e) => bulkForm.setData('dorm_id', e.target.value)}>
                                    <option value="">Select dorm</option>
                                    {dorms.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                </select>
                                {bulkForm.errors.dorm_id && <p className="text-sm text-red-600">{bulkForm.errors.dorm_id}</p>}
                            </div>
                            <button type="submit" disabled={bulkForm.processing || bulkForm.data.user_ids.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded">Assign Selected</button>
                        </form>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Current Staff</h3>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-gray-600">
                                    <th className="py-2">Name</th>
                                    <th>Email</th>
                                    <th>Dorm</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffList.map(s => (
                                    <tr key={s.id} className="border-t">
                                        <td className="py-2">{s.user?.name}</td>
                                        <td>{s.user?.email}</td>
                                        <td>{s.dorm?.name} ({s.dorm?.code})</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="px-3 py-1 text-sm bg-red-600 text-white rounded disabled:opacity-50"
                                                disabled={revokingId === s.user_id}
                                                onClick={() => {
                                                    setRevokingId(s.user_id);
                                                    router.post(route('admin.dorms.revokeStaff'), { user_id: s.user_id }, {
                                                        preserveScroll: true,
                                                        onFinish: () => setRevokingId(null),
                                                    });
                                                }}
                                            >
                                                {revokingId === s.user_id ? 'Revoking...' : 'Revoke'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {staffList.length === 0 && (
                                    <tr><td colSpan="4" className="py-2 text-gray-500">No staff assigned yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
