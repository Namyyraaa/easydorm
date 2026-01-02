import { useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Transactions() {
    const { props } = usePage();
    const { transactions, items, blocks, rooms, dorm, flash } = props;

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

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory Transactions - {dorm?.code}</h2>}>
            <Head title="Inventory Transactions" />
            <div className="py-8 max-w-7xl mx-auto space-y-10">
                {flash?.success && <div className="p-3 bg-green-100 text-green-700 rounded">{flash.success}</div>}
                {flash?.error && <div className="p-3 bg-red-100 text-red-700 rounded">{flash.error}</div>}

                <div className="grid md:grid-cols-2 gap-6 p-6">
                    <form onSubmit={submitReceive} className="bg-white p-4 rounded shadow space-y-3">
                        <h3 className="font-medium">Receive</h3>
                        <select className="w-full border rounded px-2 py-2" value={receiveForm.data.item_id} onChange={e => receiveForm.setData('item_id', e.target.value)} required>
                            <option value="">Item...</option>{itemOptions}
                        </select>
                        <input type="number" min={1} className="w-full border rounded px-2 py-2" value={receiveForm.data.quantity} onChange={e => receiveForm.setData('quantity', e.target.value)} required />
                        <input placeholder="Reference" className="w-full border rounded px-2 py-2" value={receiveForm.data.reference} onChange={e => receiveForm.setData('reference', e.target.value)} />
                        <textarea placeholder="Note" className="w-full border rounded px-2 py-2" value={receiveForm.data.note} onChange={e => receiveForm.setData('note', e.target.value)} />
                        <button disabled={receiveForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Receive</button>
                    </form>

                    <form onSubmit={submitAssign} className="bg-white p-4 rounded shadow space-y-3">
                        <h3 className="font-medium">Assign to Room</h3>
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

                    <form onSubmit={submitTransfer} className="bg-white p-6 rounded shadow space-y-3">
                        <h3 className="font-medium">Transfer Room → Room</h3>
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

                    <form onSubmit={submitDemolishCentral} className="bg-white p-4 rounded shadow space-y-3">
                        <h3 className="font-medium">Demolish (Central)</h3>
                        <select className="w-full border rounded px-2 py-2" value={demolishCentralForm.data.item_id} onChange={e => demolishCentralForm.setData('item_id', e.target.value)} required>
                            <option value="">Item...</option>{itemOptions}
                        </select>
                        <input type="number" min={1} className="w-full border rounded px-2 py-2" value={demolishCentralForm.data.quantity} onChange={e => demolishCentralForm.setData('quantity', e.target.value)} required />
                        <input placeholder="Reason" className="w-full border rounded px-2 py-2" value={demolishCentralForm.data.reason} onChange={e => demolishCentralForm.setData('reason', e.target.value)} required />
                        <button disabled={demolishCentralForm.processing} className="bg-indigo-600 text-white px-4 py-2 rounded">Demolish</button>
                    </form>

                    <form onSubmit={submitDemolishRoom} className="bg-white p-4 rounded shadow space-y-3">
                        <h3 className="font-medium">Demolish (Room)</h3>
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

                    <form onSubmit={submitUnassign} className="bg-white p-4 rounded shadow space-y-3">
                        <h3 className="font-medium">Unassign (Room → Central)</h3>
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
                </div>

                <div className="bg-white rounded shadow overflow-hidden">
                    <div className="px-4 py-2 border-b font-medium">Recent Transactions</div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions?.map(t => (
                                <tr key={t.id}>
                                    <td className="px-4 py-2 text-sm">{new Date(t.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-2 text-sm">{t.item?.name}</td>
                                    <td className="px-4 py-2 text-sm capitalize">{t.type.replace('_',' ')}</td>
                                    <td className="px-4 py-2 text-sm">{t.quantity}</td>
                                    <td className="px-4 py-2 text-sm">{
                                        t.from_room_id
                                            ? formatLocation(t.from_block_id, t.from_room_id)
                                            : (t.type === 'demolish_central' ? 'Central' : (t.type === 'unassign' ? formatLocation(t.from_block_id, t.from_room_id) : '—'))
                                    }</td>
                                    <td className="px-4 py-2 text-sm">{
                                        t.to_room_id
                                            ? formatLocation(t.to_block_id, t.to_room_id)
                                            : (t.type === 'receive' || t.type === 'unassign' ? 'Central' : '—')
                                    }</td>
                                    <td className="px-4 py-2 text-sm">{t.performer?.name}</td>
                                </tr>
                            ))}
                            {(!transactions || transactions.length === 0) && (
                                <tr><td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={7}>No transactions yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
