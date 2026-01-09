import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import EditVisitorModal from '@/Components/Visitors/EditVisitorModal';

export default function VisitorLists() {
  const { props } = usePage();
  const blocks = props.blocks || [];
  const rooms = props.rooms || [];
  const activeVisitors = props.activeVisitors || [];
  const recentVisitors = props.recentVisitors || [];

  const [checkoutAt, setCheckoutAt] = useState({});
  const [editModal, setEditModal] = useState({ open: false, visitor: null });
  const [activeSearch, setActiveSearch] = useState('');
  const [recentSearch, setRecentSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const pageSize = 10;

  function localToISO(dtLocal) {
    if (!dtLocal) return '';
    const d = new Date(dtLocal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
  }

  function checkout(id) {
    const value = checkoutAt[id];
    const payload = value ? { out_time: localToISO(value) || '' } : {};
    router.patch(route('staff.visitors.checkout', id), payload, { preserveScroll: true });
  }

  function updateRow(id, payload) {
    if (payload?.arrival_time) {
      const iso = localToISO(payload.arrival_time);
      if (iso) payload.arrival_time = iso;
    }
    if (payload?.out_time) {
      const isoO = localToISO(payload.out_time);
      if (isoO) payload.out_time = isoO;
    }
    router.patch(route('staff.visitors.update', id), payload, { preserveScroll: true });
  }

  function handleEdit(visitor) {
    setEditModal({ open: true, visitor });
  }
  function handleEditSave(form) {
    const id = editModal.visitor?.id;
    setEditModal({ open: false, visitor: null });
    if (id) updateRow(id, form);
  }
  function handleEditClose() {
    setEditModal({ open: false, visitor: null });
  }
  function handleDelete(id) {
    if (window.confirm('Delete this visitor log?')) {
      router.delete(route('staff.visitors.destroy', id), { preserveScroll: true });
    }
  }

  const fmtDateTime = (dt) => {
    if (!dt) return { date: '-', time: '' };
    const d = new Date(dt);
    if (isNaN(d.getTime())) return { date: '-', time: '' };
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="space-y-6">
      <EditVisitorModal open={editModal.open} onClose={handleEditClose} onSave={handleEditSave} visitor={editModal.visitor || {}} blocks={blocks} rooms={rooms} />

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Active Visitors</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => { setActiveSearch(e.target.value); setActivePage(1); }}
              placeholder="Search by name or phone"
              className="rounded border-gray-300 text-sm px-2 py-1 focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
            />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="py-2 text-left w-1/3">Name</th>
              <th className="text-left w-1/6">Company</th>
              <th className="text-left">Phone</th>
              <th className="text-left whitespace-nowrap">Block</th>
              <th className="text-left whitespace-nowrap">Room</th>
              <th className="text-left whitespace-nowrap">Arrival</th>
              <th className="text-left">Reason</th>
              <th className="text-left whitespace-nowrap">Checkout At (optional)</th>
              <th className="text-left whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = (activeVisitors || []).filter(v => {
                const q = activeSearch.trim().toLowerCase();
                if (!q) return true;
                return [v.visitor_name || '', v.phone || ''].some(s => String(s).toLowerCase().includes(q));
              });
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              const start = (activePage - 1) * pageSize;
              const end = start + pageSize;
              const display = filtered.slice(start, end);
              return (
                <>
                  {display.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="py-2 align-middle w-1/3"><div className="truncate max-w-56">{v.visitor_name}</div></td>
                      <td className="py-2 align-middle w-1/6"><div className="truncate max-w-40">{v.company || '-'}</div></td>
                      <td className="py-2 align-middle">{v.phone || '-'}</td>
                      <td className="py-2 align-middle whitespace-nowrap">{v.block?.name || '-'}</td>
                      <td className="py-2 align-middle whitespace-nowrap">{v.room?.room_number || '-'}</td>
                      <td className="py-2 align-middle whitespace-nowrap">
                        {(() => {
                          const dt = fmtDateTime(v.arrival_time);
                          return (
                            <div className="leading-tight">
                              <div>{dt.date}</div>
                              <div className="text-xs text-gray-600">{dt.time}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 align-middle">{v.entry_reason || '-'}</td>
                      <td className="py-2 align-middle whitespace-nowrap">
                        <input
                          type="datetime-local"
                          className="border rounded px-2 py-1"
                          value={checkoutAt[v.id] || ''}
                          onChange={e => setCheckoutAt(prev => ({ ...prev, [v.id]: e.target.value }))}
                        />
                      </td>
                      <td className="py-2 align-middle text-right flex items-center gap-2 whitespace-nowrap">
                        <button type="button" className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1" onClick={() => checkout(v.id)}>Checkout</button>
                        <button type="button" className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1" onClick={() => handleEdit(v)}>Edit</button>
                        <button type="button" className="inline-flex items-center px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1" onClick={() => handleDelete(v.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {display.length === 0 && (
                    <tr><td colSpan="9" className="py-2 text-gray-500">{filtered.length === 0 ? 'No active visitors' : 'No matching visitors'}</td></tr>
                  )}
                  {filtered.length > 0 && (
                    <tr>
                      <td colSpan="9" className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filtered.length)} of {filtered.length}</div>
                          <div className="flex items-center gap-1">
                            <button disabled={activePage === 1} onClick={() => setActivePage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <button key={i} onClick={() => setActivePage(i + 1)} className={`px-2 py-1 rounded border text-sm ${activePage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                            ))}
                            <button disabled={activePage === totalPages} onClick={() => setActivePage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })()}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent Checkouts</h3>
          <input
            type="text"
            value={recentSearch}
            onChange={(e) => { setRecentSearch(e.target.value); setRecentPage(1); }}
            placeholder="Search by name or phone"
            className="rounded border-gray-300 text-sm px-2 py-1 focus:outline-none transition-shadow hover:ring-2 hover:ring-purple-300 hover:ring-offset-1 focus:ring-2 focus:ring-purple-700 focus:ring-offset-1"
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="py-2 text-left w-1/3">Name</th>
              <th className="text-left w-1/6">Company</th>
              <th className="text-left">Phone</th>
              <th className="text-left whitespace-nowrap">Block</th>
              <th className="text-left whitespace-nowrap">Room</th>
              <th className="text-left whitespace-nowrap">Arrival</th>
              <th className="text-left whitespace-nowrap">Out</th>
              <th className="text-left">Reason</th>
              <th className="text-left whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = (recentVisitors || []).filter(v => {
                const q = recentSearch.trim().toLowerCase();
                if (!q) return true;
                return [v.visitor_name || '', v.phone || ''].some(s => String(s).toLowerCase().includes(q));
              });
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              const start = (recentPage - 1) * pageSize;
              const end = start + pageSize;
              const display = filtered.slice(start, end);
              return (
                <>
                  {display.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="py-2 align-middle w-1/3"><div className="truncate max-w-56">{v.visitor_name}</div></td>
                      <td className="py-2 align-middle w-1/6"><div className="truncate max-w-40">{v.company || '-'}</div></td>
                      <td className="py-2 align-middle">{v.phone || '-'}</td>
                      <td className="py-2 align-middle whitespace-nowrap">{blocks.find(b => b.id === v.block_id)?.name || '-'}</td>
                      <td className="py-2 align-middle whitespace-nowrap">{rooms.find(r => r.id === v.room_id)?.room_number || '-'}</td>
                      <td className="py-2 align-middle whitespace-nowrap">
                        {(() => {
                          const dt = fmtDateTime(v.arrival_time);
                          return (
                            <div className="leading-tight">
                              <div>{dt.date}</div>
                              <div className="text-xs text-gray-600">{dt.time}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 align-middle whitespace-nowrap">
                        {(() => {
                          const dt = fmtDateTime(v.out_time);
                          return (
                            <div className="leading-tight">
                              <div>{dt.date}</div>
                              <div className="text-xs text-gray-600">{dt.time}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 align-middle">{v.entry_reason || '-'}</td>
                      <td className="py-2 align-middle text-right flex items-center gap-2 whitespace-nowrap">
                        <button type="button" className="inline-flex items-center px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1" onClick={() => handleEdit(v)}>Edit</button>
                        <button type="button" className="inline-flex items-center px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1" onClick={() => handleDelete(v.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {display.length === 0 && (
                    <tr><td colSpan="9" className="py-2 text-gray-500">{filtered.length === 0 ? 'No recent activity' : 'No matching activity'}</td></tr>
                  )}
                  {filtered.length > 0 && (
                    <tr>
                      <td colSpan="9" className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">Showing {start + 1} - {Math.min(end, filtered.length)} of {filtered.length}</div>
                          <div className="flex items-center gap-1">
                            <button disabled={recentPage === 1} onClick={() => setRecentPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <button key={i} onClick={() => setRecentPage(i + 1)} className={`px-2 py-1 rounded border text-sm ${recentPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}>{i + 1}</button>
                            ))}
                            <button disabled={recentPage === totalPages} onClick={() => setRecentPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded border text-sm disabled:opacity-50">Next</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
