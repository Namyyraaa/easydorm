import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';

export default function Dashboard() {
    const { props } = usePage();
    const notifications = props.notifications || { unread: 0, latest: [] };
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 space-y-6">
                            <div>You're logged in!</div>
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Notifications</h3>
                                    <span className="text-sm text-gray-600">Unread: {notifications.unread}</span>
                                </div>
                                <div className="mt-3 divide-y">
                                    {(notifications.latest || []).map((n) => (
                                        <div key={n.id} className="py-2 text-sm">
                                            <div className="font-medium">{titleFor(n)}</div>
                                            <div className="text-gray-600">{detailFor(n)}</div>
                                        </div>
                                    ))}
                                    {(notifications.latest || []).length === 0 && <p className="text-sm text-gray-600">No notifications yet.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function titleFor(n) {
    const t = n.type;
    if (t === 'fine_issued') return 'New Fine Issued';
    if (t === 'fine_updated') return 'Fine Updated';
    if (t === 'fine_due_soon') return 'Fine Due Soon';
    if (t === 'fine_appeal_submitted') return 'Appeal Submitted';
    if (t === 'fine_appeal_decided') return 'Appeal Decision';
    return 'Notification';
}

function detailFor(n) {
    const d = n.data || {};
    if (n.type === 'fine_issued') return `ID ${d.fine_code} • RM ${Number(d.amount_rm || 0).toFixed(2)} • Due ${d.due_date}`;
    if (n.type === 'fine_updated') return `ID ${d.fine_code} • Updated: ${(d.updated_fields || []).join(', ')}`;
    if (n.type === 'fine_due_soon') return `ID ${d.fine_code} • Due ${d.due_date} in ${d.days} day(s)`;
    if (n.type === 'fine_appeal_submitted') return `ID ${d.fine_code} • Appeal pending`;
    if (n.type === 'fine_appeal_decided') return `ID ${d.fine_code} • ${d.status}`;
    return '';
}
