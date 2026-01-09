import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function Stock() {
    const { props } = usePage();
    const { dorm, items, central, roomStocks, rooms, flash } = props;

    // Build a lookup for room stock: { room_id: { item_id: qty } }
    const roomItemMap = {};
    (roomStocks || []).forEach(rs => {
        if (!roomItemMap[rs.room_id]) roomItemMap[rs.room_id] = {};
        roomItemMap[rs.room_id][rs.item_id] = rs.quantity;
    });

    // Pagination and filters
    const pageSize = 10;
    const [centralPage, setCentralPage] = useState(1);
    const [roomPage, setRoomPage] = useState(1);
    const [blockFilter, setBlockFilter] = useState('all');

    const blocks = useMemo(() => {
        const b = new Set((rooms || []).map(r => r.block?.name).filter(Boolean));
        return ['all', ...Array.from(b)];
    }, [rooms]);

    const centralItems = useMemo(() => Array.isArray(central) ? central : [], [central]);
    const centralTotalPages = Math.max(1, Math.ceil(centralItems.length / pageSize));
    const centralStart = (centralPage - 1) * pageSize;
    const centralEnd = centralStart + pageSize;
    const centralDisplay = useMemo(() => centralItems.slice(centralStart, centralEnd), [centralItems, centralStart, centralEnd]);

    const filteredRooms = useMemo(() => {
        return (rooms || []).filter(r => blockFilter === 'all' || r.block?.name === blockFilter);
    }, [rooms, blockFilter]);
    useEffect(() => { setRoomPage(1); }, [blockFilter]);
    const roomTotalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize));
    const roomStart = (roomPage - 1) * pageSize;
    const roomEnd = roomStart + pageSize;
    const roomDisplay = useMemo(() => filteredRooms.slice(roomStart, roomEnd), [filteredRooms, roomStart, roomEnd]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Room Allocation - {(dorm?.code || '').toUpperCase()}</h2>}>
            <Head title="Room Allocation" />
            <div className="py-12 space-y-6">
                {(flash?.success || flash?.error) && (
                    <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash?.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash?.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>{flash?.error || flash?.success}</div>
                )}

                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
                    <h3 className="font-semibold mb-3">Central Store</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-600">
                                <th className="py-2 text-left">Item</th>
                                <th className="text-left">SKU</th>
                                <th className="text-left">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {centralDisplay.map(c => (
                                <tr key={c.id} className="border-t">
                                    <td className="py-2">{c.item?.name}</td>
                                    <td className="py-2">{c.item?.sku || '-'}</td>
                                    <td className="py-2">{c.quantity}</td>
                                </tr>
                            ))}
                            {centralDisplay.length === 0 && (
                                <tr><td className="py-3 text-gray-600" colSpan={3}>{centralItems.length === 0 ? 'No stock in central store.' : 'No items on this page.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                    {centralItems.length > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">Showing {centralStart + 1} - {Math.min(centralEnd, centralItems.length)} of {centralItems.length}</div>
                            <div className="flex items-center gap-1">
                                <button disabled={centralPage === 1} onClick={() => setCentralPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                                {Array.from({ length: centralTotalPages }).map((_, i) => (
                                    <button key={i} onClick={() => setCentralPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${centralPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                                ))}
                                <button disabled={centralPage === centralTotalPages} onClick={() => setCentralPage(p => Math.min(centralTotalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6 overflow-x-auto">
                    <h3 className="font-semibold mb-3">Per Room</h3>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-3">
                            <div className="flex items-center">
                                <label className="text-sm text-gray-600">Block</label>
                                <select
                                    value={blockFilter}
                                    onChange={e => setBlockFilter(e.target.value)}
                                    className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                                >
                                    {blocks.map(b => (
                                        <option key={b} value={b}>{b === 'all' ? 'All' : b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button onClick={() => setBlockFilter('all')} className="text-sm text-gray-600 hover:underline">Reset</button>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-600">
                                <th className="py-2 text-left">Room</th>
                                {items?.map(it => (
                                    <th key={it.id} className="text-left">{it.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roomDisplay.map(r => (
                                <tr key={r.id} className="border-t">
                                    <td className="py-2">{r.block?.name} {r.room_number}</td>
                                    {items?.map(it => (
                                        <td key={it.id} className="py-2">{roomItemMap[r.id]?.[it.id] || 0}</td>
                                    ))}
                                </tr>
                            ))}
                            {roomDisplay.length === 0 && (
                                <tr><td className="py-3 text-gray-600" colSpan={(items?.length || 0) + 1}>{filteredRooms.length === 0 ? 'No rooms.' : 'No rooms on this page.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                    {filteredRooms.length > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">Showing {roomStart + 1} - {Math.min(roomEnd, filteredRooms.length)} of {filteredRooms.length}</div>
                            <div className="flex items-center gap-1">
                                <button disabled={roomPage === 1} onClick={() => setRoomPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                                {Array.from({ length: roomTotalPages }).map((_, i) => (
                                    <button key={i} onClick={() => setRoomPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${roomPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                                ))}
                                <button disabled={roomPage === roomTotalPages} onClick={() => setRoomPage(p => Math.min(roomTotalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
