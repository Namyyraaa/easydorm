import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Stock() {
    const { props } = usePage();
    const { dorm, items, central, roomStocks, rooms, flash } = props;

    // Build a lookup for room stock: { room_id: { item_id: qty } }
    const roomItemMap = {};
    (roomStocks || []).forEach(rs => {
        if (!roomItemMap[rs.room_id]) roomItemMap[rs.room_id] = {};
        roomItemMap[rs.room_id][rs.item_id] = rs.quantity;
    });

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Room Allocation - {dorm?.code}</h2>}>
            <Head title="Room Allocation" />
            <div className="py-8 max-w-7xl mx-auto space-y-8">
                {flash?.success && <div className="p-3 bg-green-100 text-green-700 rounded">{flash.success}</div>}
                {flash?.error && <div className="p-3 bg-red-100 text-red-700 rounded">{flash.error}</div>}

                <div className="bg-white rounded shadow overflow-hidden">
                    <div className="px-4 py-2 border-b font-medium">Central Store</div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(central || []).map(c => (
                                <tr key={c.id}>
                                    <td className="px-4 py-2 text-sm">{c.item?.name}</td>
                                    <td className="px-4 py-2 text-sm">{c.item?.sku || '-'}</td>
                                    <td className="px-4 py-2 text-sm">{c.quantity}</td>
                                </tr>
                            ))}
                            {(!central || central.length === 0) && (
                                <tr><td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={3}>No stock in central store.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded shadow overflow-x-auto">
                    <div className="px-4 py-2 border-b font-medium">Per Room</div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                                {items?.map(it => (
                                    <th key={it.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{it.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rooms?.map(r => (
                                <tr key={r.id}>
                                    <td className="px-4 py-2 text-sm">{r.block?.name} {r.room_number}</td>
                                    {items?.map(it => (
                                        <td key={it.id} className="px-4 py-2 text-sm">{roomItemMap[r.id]?.[it.id] || 0}</td>
                                    ))}
                                </tr>
                            ))}
                            {(!rooms || rooms.length === 0) && (
                                <tr><td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={(items?.length || 0) + 1}>No rooms.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
