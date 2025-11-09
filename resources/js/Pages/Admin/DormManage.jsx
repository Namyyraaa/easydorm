import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import React from 'react';

export default function DormManage() {
  const { props } = usePage();
  const dorm = props.dorm;
  const blocks = props.blocks || [];
  const rooms = props.rooms || [];
  const flash = props.flash || {};

  const blockForm = useForm({ name: '', gender: 'male' });
  const roomForm = useForm({ block_id: '', room_number: '', capacity: '' });

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Manage Dorm — {dorm.name} ({dorm.code})</h2>}>
      <Head title={`Manage ${dorm.name}`} />
      <div className="py-12 space-y-8">
        {(flash.success || flash.error) && (
          <div className={`mx-auto max-w-7xl sm:px-6 lg:px-8 ${flash.error ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'} border ${flash.error ? 'border-red-200' : 'border-green-200'} rounded p-3`}>
            {flash.error || flash.success}
          </div>
        )}

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold mb-4">Add Block</h3>
            <form onSubmit={(e) => { e.preventDefault(); blockForm.post(route('admin.dorms.blocks.store', dorm.id), { onSuccess: () => blockForm.reset('name') }); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input className="mt-1 w-full border rounded p-2" value={blockForm.data.name} onChange={(e) => blockForm.setData('name', e.target.value)} />
                {blockForm.errors.name && <p className="text-sm text-red-600">{blockForm.errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Gender</label>
                <select className="mt-1 w-full border rounded p-2" value={blockForm.data.gender} onChange={(e) => blockForm.setData('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {blockForm.errors.gender && <p className="text-sm text-red-600">{blockForm.errors.gender}</p>}
              </div>
              <button type="submit" disabled={blockForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Add Block</button>
            </form>
          </div>

          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6 col-span-2">
            <h3 className="font-semibold mb-4">Blocks</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2">Name</th>
                  <th>Gender</th>
                  <th>Active Rooms</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="py-2">{b.name}</td>
                    <td>{b.gender}</td>
                    <td>{b.active_rooms_count}</td>
                  </tr>
                ))}
                {blocks.length === 0 && (
                  <tr><td colSpan="3" className="py-2 text-gray-500">No blocks yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            <h3 className="font-semibold mb-4">Add Room</h3>
            <form onSubmit={(e) => { e.preventDefault(); roomForm.post(route('admin.dorms.rooms.store', dorm.id), { onSuccess: () => roomForm.reset('room_number','capacity') }); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Block</label>
                <select className="mt-1 w-full border rounded p-2" value={roomForm.data.block_id} onChange={(e) => roomForm.setData('block_id', e.target.value)}>
                  <option value="">Select block</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.name} ({b.gender})</option>)}
                </select>
                {roomForm.errors.block_id && <p className="text-sm text-red-600">{roomForm.errors.block_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Room Number</label>
                <input className="mt-1 w-full border rounded p-2" value={roomForm.data.room_number} onChange={(e) => roomForm.setData('room_number', e.target.value)} />
                {roomForm.errors.room_number && <p className="text-sm text-red-600">{roomForm.errors.room_number}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Capacity</label>
                <input type="number" min="1" className="mt-1 w-full border rounded p-2" value={roomForm.data.capacity} onChange={(e) => roomForm.setData('capacity', e.target.value)} />
                {roomForm.errors.capacity && <p className="text-sm text-red-600">{roomForm.errors.capacity}</p>}
              </div>
              <button type="submit" disabled={roomForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Add Room</button>
            </form>
          </div>

          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6 col-span-2">
            <h3 className="font-semibold mb-4">Rooms</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="py-2">Block</th>
                  <th>Room</th>
                  <th>Capacity</th>
                  <th>Occupants</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.block?.name || '-'}</td>
                    <td>{r.room_number}</td>
                    <td>{r.capacity}</td>
                    <td>{r.occupants}</td>
                    <td>{r.available}</td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr><td colSpan="5" className="py-2 text-gray-500">No rooms yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
