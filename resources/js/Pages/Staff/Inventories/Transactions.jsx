import { useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

export default function Transactions() {
    const { props } = usePage();
    const rawTx = props.transactions || [];
    const transactions = Array.isArray(rawTx) ? rawTx : (rawTx?.data || []);
    const items = props.items || [];
    const blocks = props.blocks || [];
    const rooms = props.rooms || [];
    const dorm = props.dorm;
    const flash = props.flash || {};

    const receiveForm = useForm({ item_id: '', quantity: 1, reference: '', note: '' });
    const assignForm = useForm({ item_id: '', block_id: '', room_id: '', quantity: 1, reference: '', note: '' });
    const transferForm = useForm({ item_id: '', from_block_id: '', from_room_id: '', to_block_id: '', to_room_id: '', quantity: 1, reference: '' });
    const demolishCentralForm = useForm({ item_id: '', quantity: 1, reason: '' });
    const demolishRoomForm = useForm({ item_id: '', block_id: '', room_id: '', quantity: 1, reason: '' });
    const unassignForm = useForm({ item_id: '', block_id: '', room_id: '', quantity: 1, reference: '' });

    function submitReceive(e) {
        e.preventDefault();
        receiveForm.post(route('staff.inventory.transactions.receive'), { onSuccess: () => receiveForm.reset('quantity','reference','note') });
    }
    function submitAssign(e) {
        e.preventDefault();
        assignForm.post(route('staff.inventory.transactions.assign'), { onSuccess: () => assignForm.reset('quantity','reference','note') });
    }
    function submitTransfer(e) {
        e.preventDefault();
        transferForm.post(route('staff.inventory.transactions.transfer'), { onSuccess: () => transferForm.reset('quantity','reference') });
    }
    function submitDemolishCentral(e) {
        e.preventDefault();
        demolishCentralForm.post(route('staff.inventory.transactions.demolishCentral'), { onSuccess: () => demolishCentralForm.reset('quantity','reason') });
    }
    function submitDemolishRoom(e) {
        e.preventDefault();
        demolishRoomForm.post(route('staff.inventory.transactions.demolishRoom'), { onSuccess: () => demolishRoomForm.reset('quantity','reason') });
    }
    function submitUnassign(e) {
        e.preventDefault();
        unassignForm.post(route('staff.inventory.transactions.unassign'), { onSuccess: () => unassignForm.reset('quantity','reference') });
    }

    const itemOptions = items?.map(i => <option key={i.id} value={i.id}>{i.name}</option>);
    const blockOptions = blocks?.map(b => <option key={b.id} value={b.id}>{b.name}</option>);
    const optionsForBlock = (bid) => rooms?.filter(r => String(r.block_id) === String(bid)).map(r => <option key={r.id} value={r.id}>{r.room_number}</option>);

    const blockNameById = (id) => blocks?.find(b => b.id === id)?.name || `Block ${id}`;
    const roomNumberById = (id) => rooms?.find(r => r.id === id)?.room_number || id;
    const formatLocation = (blockId, roomId) => {
        if (!roomId) return null;
        return `${blockNameById(blockId)} / ${roomNumberById(roomId)}`;
    };

        // Tab state with URL hash persistence
        const tabs = [
            { key: 'receive', label: 'Receive' },
            { key: 'assign', label: 'Assign' },
            { key: 'transfer', label: 'Transfer' },
            { key: 'demolish-central', label: 'Demolish (Central)' },
            { key: 'demolish-room', label: 'Demolish (Room)' },
            { key: 'unassign', label: 'Unassign' },
        ];
        const normalizeHash = (h) => (h || '').replace(/^#/, '');
        const initialTab = (() => {
            const h = normalizeHash(typeof window !== 'undefined' ? window.location.hash : '');
            return tabs.some(t => t.key === h) ? h : 'receive';
        })();
        const [activeTab, setActiveTab] = useState(initialTab);
        useEffect(() => {
            const onHashChange = () => {
                const h = normalizeHash(window.location.hash);
                if (tabs.some(t => t.key === h)) setActiveTab(h);
            };
            window.addEventListener('hashchange', onHashChange);
            return () => window.removeEventListener('hashchange', onHashChange);
        }, []);
        const activate = (key) => {
            setActiveTab(key);
            if (typeof window !== 'undefined') window.location.hash = key;
        };

        // Filters for Recent Transactions
        const [typeFilter, setTypeFilter] = useState('all');
        const [itemFilter, setItemFilter] = useState('all');
        const [blockFilter, setBlockFilter] = useState('all');
        const [page, setPage] = useState(1);
        const pageSize = 10;

        const typeOptions = useMemo(() => {
            const s = new Set(transactions.map(t => t.type).filter(Boolean));
            return ['all', ...Array.from(s)];
        }, [transactions]);

        const blockOptionsForFilter = useMemo(() => {
            const ids = new Set();
            transactions.forEach(t => { if (t.from_block_id) ids.add(String(t.from_block_id)); if (t.to_block_id) ids.add(String(t.to_block_id)); });
            return ['all', ...Array.from(ids)];
        }, [transactions]);

        const filteredTx = useMemo(() => {
            return transactions.filter(t => (
                (typeFilter === 'all' || t.type === typeFilter) &&
                (itemFilter === 'all' || String(t.item?.id ?? t.item_id) === String(itemFilter)) &&
                (blockFilter === 'all' || String(t.from_block_id) === String(blockFilter) || String(t.to_block_id) === String(blockFilter))
            ));
        }, [transactions, typeFilter, itemFilter, blockFilter]);

        useEffect(() => { setPage(1); }, [typeFilter, itemFilter, blockFilter]);

        const totalPages = Math.max(1, Math.ceil(filteredTx.length / pageSize));
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const displayTx = useMemo(() => filteredTx.slice(start, end), [filteredTx, start, end]);

        const formatDateTime = (dt) => {
            if (!dt) return '';
            try {
                return new Date(dt).toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                });
            } catch { return ''; }
        };

        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory Transactions - {dorm?.code}</h2>}>
                <Head title="Inventory Transactions" />
                <div className="py-12 space-y-6">
                    {(flash.success || flash.error) && (
                        <div className={`mx-auto max-w-5xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>{flash.error || flash.success}</div>
                    )}

                    {/* Tabs outside the card */}
                    <div className="mx-auto max-w-5xl ">
                        <div className="border-b border-violet-200 mb-6">
                            <nav className="-mb-px flex w-full" aria-label="Tabs">
                                {tabs.map(t => (
                                    <button
                                        type="button"
                                        key={t.key}
                                        onClick={() => activate(t.key)}
                                        className={`whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium flex-1 text-center ${activeTab === t.key ? 'border-violet-500 text-violet-800' : 'border-transparent text-gray-500 hover:text-violet-700 hover:border-violet-300'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Active form card */}
                    <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
                        {activeTab === 'receive' && (
                            <form onSubmit={submitReceive} className="space-y-3">
                                <h3 className="font-semibold">Receive</h3>
                                <select className="w-full border rounded px-2 py-2" value={receiveForm.data.item_id} onChange={e => receiveForm.setData('item_id', e.target.value)} required>
                                    <option value="">Item...</option>{itemOptions}
                                </select>
                                <input type="number" min={1} className="w-full border rounded px-2 py-2" value={receiveForm.data.quantity} onChange={e => receiveForm.setData('quantity', e.target.value)} required />
                                <input placeholder="Reference" className="w-full border rounded px-2 py-2" value={receiveForm.data.reference} onChange={e => receiveForm.setData('reference', e.target.value)} />
                                <textarea placeholder="Note" className="w-full border rounded px-2 py-2" value={receiveForm.data.note} onChange={e => receiveForm.setData('note', e.target.value)} />
                                <button disabled={receiveForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Receive</button>
                            </form>
                        )}

                        {activeTab === 'assign' && (
                            <form onSubmit={submitAssign} className="space-y-3">
                                <h3 className="font-semibold">Assign to Room</h3>
                                <select className="w-full border rounded px-2 py-2" value={assignForm.data.item_id} onChange={e => assignForm.setData('item_id', e.target.value)} required>
                                    <option value="">Item...</option>{itemOptions}
                                </select>
                                <div className="flex gap-2">
                                    <select className="w-1/2 border rounded px-2 py-2" value={assignForm.data.block_id} onChange={e => { assignForm.setData('block_id', e.target.value); assignForm.setData('room_id',''); }} required>
                                        <option value="">Block...</option>{blockOptions}
                                    </select>
                                    <select className="w-1/2 border rounded px-2 py-2" value={assignForm.data.room_id} onChange={e => assignForm.setData('room_id', e.target.value)} required disabled={!assignForm.data.block_id}>
                                        <option value="">Room...</option>{optionsForBlock(assignForm.data.block_id)}
                                    </select>
                                </div>
                                <input type="number" min={1} className="w-full border rounded px-2 py-2" value={assignForm.data.quantity} onChange={e => assignForm.setData('quantity', e.target.value)} required />
                                <input placeholder="Reference" className="w-full border rounded px-2 py-2" value={assignForm.data.reference} onChange={e => assignForm.setData('reference', e.target.value)} />
                                <textarea placeholder="Note" className="w-full border rounded px-2 py-2" value={assignForm.data.note} onChange={e => assignForm.setData('note', e.target.value)} />
                                <button disabled={assignForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Assign</button>
                            </form>
                        )}

                        {activeTab === 'transfer' && (
                            <form onSubmit={submitTransfer} className="space-y-3">
                                <h3 className="font-semibold">Transfer Room → Room</h3>
                                <select className="w-full border rounded px-2 py-2" value={transferForm.data.item_id} onChange={e => transferForm.setData('item_id', e.target.value)} required>
                                    <option value="">Item...</option>{itemOptions}
                                </select>
                                <div className="flex gap-2">
                                    <div className="w-1/2 flex gap-2">
                                        <select className="w-1/2 border rounded px-2 py-2" value={transferForm.data.from_block_id} onChange={e => { transferForm.setData('from_block_id', e.target.value); transferForm.setData('from_room_id', ''); }} required>
                                            <option value="">From block...</option>{blockOptions}
                                        </select>
                                        <select className="w-1/2 border rounded px-2 py-2" value={transferForm.data.from_room_id} onChange={e => transferForm.setData('from_room_id', e.target.value)} required disabled={!transferForm.data.from_block_id}>
                                            <option value="">From room...</option>{optionsForBlock(transferForm.data.from_block_id)}
                                        </select>
                                    </div>
                                    <div className="w-1/2 flex gap-2">
                                        <select className="w-1/2 border rounded px-2 py-2" value={transferForm.data.to_block_id} onChange={e => { transferForm.setData('to_block_id', e.target.value); transferForm.setData('to_room_id', ''); }} required>
                                            <option value="">To block...</option>{blockOptions}
                                        </select>
                                        <select className="w-1/2 border rounded px-2 py-2" value={transferForm.data.to_room_id} onChange={e => transferForm.setData('to_room_id', e.target.value)} required disabled={!transferForm.data.to_block_id}>
                                            <option value="">To room...</option>{optionsForBlock(transferForm.data.to_block_id)}
                                        </select>
                                    </div>
                                </div>
                                <input type="number" min={1} className="w-full border rounded px-2 py-2" value={transferForm.data.quantity} onChange={e => transferForm.setData('quantity', e.target.value)} required />
                                <input placeholder="Reference" className="w-full border rounded px-2 py-2" value={transferForm.data.reference} onChange={e => transferForm.setData('reference', e.target.value)} />
                                <button disabled={transferForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Transfer</button>
                            </form>
                        )}

                        {activeTab === 'demolish-central' && (
                            <form onSubmit={submitDemolishCentral} className="space-y-3">
                                <h3 className="font-semibold">Demolish (Central)</h3>
                                <select className="w-full border rounded px-2 py-2" value={demolishCentralForm.data.item_id} onChange={e => demolishCentralForm.setData('item_id', e.target.value)} required>
                                    <option value="">Item...</option>{itemOptions}
                                </select>
                                <input type="number" min={1} className="w-full border rounded px-2 py-2" value={demolishCentralForm.data.quantity} onChange={e => demolishCentralForm.setData('quantity', e.target.value)} required />
                                <input placeholder="Reason" className="w-full border rounded px-2 py-2" value={demolishCentralForm.data.reason} onChange={e => demolishCentralForm.setData('reason', e.target.value)} required />
                                <button disabled={demolishCentralForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Demolish</button>
                            </form>
                        )}

                        {activeTab === 'demolish-room' && (
                            <form onSubmit={submitDemolishRoom} className="space-y-3">
                                <h3 className="font-semibold">Demolish (Room)</h3>
                                <select className="w-full border rounded px-2 py-2" value={demolishRoomForm.data.item_id} onChange={e => demolishRoomForm.setData('item_id', e.target.value)} required>
                                    <option value="">Item...</option>{itemOptions}
                                </select>
                                <div className="flex gap-2">
                                    <select className="w-1/2 border rounded px-2 py-2" value={demolishRoomForm.data.block_id} onChange={e => { demolishRoomForm.setData('block_id', e.target.value); demolishRoomForm.setData('room_id', ''); }} required>
                                        <option value="">Block...</option>{blockOptions}
                                    </select>
                                    <select className="w-1/2 border rounded px-2 py-2" value={demolishRoomForm.data.room_id} onChange={e => demolishRoomForm.setData('room_id', e.target.value)} required disabled={!demolishRoomForm.data.block_id}>
                                        <option value="">Room...</option>{optionsForBlock(demolishRoomForm.data.block_id)}
                                    </select>
                                </div>
                                <input type="number" min={1} className="w-full border rounded px-2 py-2" value={demolishRoomForm.data.quantity} onChange={e => demolishRoomForm.setData('quantity', e.target.value)} required />
                                <input placeholder="Reason" className="w-full border rounded px-2 py-2" value={demolishRoomForm.data.reason} onChange={e => demolishRoomForm.setData('reason', e.target.value)} required />
                                <button disabled={demolishRoomForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Demolish</button>
                            </form>
                        )}

                        {activeTab === 'unassign' && (
                            <form onSubmit={submitUnassign} className="space-y-3">
                                <h3 className="font-semibold">Unassign (Room → Central)</h3>
                                <select className="w-full border rounded px-2 py-2" value={unassignForm.data.item_id} onChange={e => unassignForm.setData('item_id', e.target.value)} required>
                                    <option value="">Item...</option>{itemOptions}
                                </select>
                                <div className="flex gap-2">
                                    <select className="w-1/2 border rounded px-2 py-2" value={unassignForm.data.block_id} onChange={e => { unassignForm.setData('block_id', e.target.value); unassignForm.setData('room_id', ''); }} required>
                                        <option value="">Block...</option>{blockOptions}
                                    </select>
                                    <select className="w-1/2 border rounded px-2 py-2" value={unassignForm.data.room_id} onChange={e => unassignForm.setData('room_id', e.target.value)} required disabled={!unassignForm.data.block_id}>
                                        <option value="">Room...</option>{optionsForBlock(unassignForm.data.block_id)}
                                    </select>
                                </div>
                                <input type="number" min={1} className="w-full border rounded px-2 py-2" value={unassignForm.data.quantity} onChange={e => unassignForm.setData('quantity', e.target.value)} required />
                                <input placeholder="Reference" className="w-full border rounded px-2 py-2" value={unassignForm.data.reference} onChange={e => unassignForm.setData('reference', e.target.value)} />
                                <button disabled={unassignForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Unassign</button>
                            </form>
                        )}
                    </div>

                    {/* Recent Transactions: maintenance-style table with filters and pagination */}
                    <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg p-6">
                        <h3 className="font-semibold mb-3">Recent Transactions</h3>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-3">
                                <div className="flex items-center">
                                    <label className="text-sm text-gray-600">Type</label>
                                    <select
                                        value={typeFilter}
                                        onChange={e => setTypeFilter(e.target.value)}
                                        className="ml-2 rounded border-gray-300 text-sm focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                                    >
                                        {typeOptions.map(t => (
                                            <option key={t} value={t}>{t === 'all' ? 'All' : t.replace(/_/g,' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <label className="text-sm text-gray-600">Item</label>
                                    <select
                                        value={itemFilter}
                                        onChange={e => setItemFilter(e.target.value)}
                                        className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                                    >
                                        <option value="all">All</option>
                                        {items.map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <label className="text-sm text-gray-600">Block</label>
                                    <select
                                        value={blockFilter}
                                        onChange={e => setBlockFilter(e.target.value)}
                                        className="ml-2 rounded border-gray-300 text-sm max-w-[16rem] focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
                                    >
                                        <option value="all">All</option>
                                        {blockOptionsForFilter.map(bid => bid === 'all' ? null : (
                                            <option key={bid} value={bid}>{blocks.find(b => String(b.id) === String(bid))?.name || `Block ${bid}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => { setTypeFilter('all'); setItemFilter('all'); setBlockFilter('all'); }} className="text-sm text-gray-600 hover:underline">Reset</button>
                        </div>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-600">
                                    <th className="py-2 text-left">Time</th>
                                    <th className="text-left">Item</th>
                                    <th className="text-left">Type</th>
                                    <th className="text-left">Qty</th>
                                    <th className="text-left">From</th>
                                    <th className="text-left">To</th>
                                    <th className="text-left">By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayTx.map(t => (
                                    <tr key={t.id} className="border-t">
                                        <td className="py-2">{formatDateTime(t.created_at)}</td>
                                        <td>{t.item?.name}</td>
                                        <td className="capitalize">{(t.type || '').replace(/_/g,' ')}</td>
                                        <td>{t.quantity}</td>
                                        <td>{t.from_room_id ? formatLocation(t.from_block_id, t.from_room_id) : (t.type === 'demolish_central' ? 'Central' : (t.type === 'unassign' ? formatLocation(t.from_block_id, t.from_room_id) : '—'))}</td>
                                        <td>{t.to_room_id ? formatLocation(t.to_block_id, t.to_room_id) : ((t.type === 'receive' || t.type === 'unassign') ? 'Central' : '—')}</td>
                                        <td>{t.performer?.name}</td>
                                    </tr>
                                ))}
                                {displayTx.length === 0 && (
                                    <tr><td colSpan="7" className="py-3 text-gray-600">{transactions.length === 0 ? 'No transactions yet.' : 'No matching transactions.'}</td></tr>
                                )}
                            </tbody>
                        </table>

                        {filteredTx.length > 0 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filteredTx.length)} of {filteredTx.length}</div>
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
