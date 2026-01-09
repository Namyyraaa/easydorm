import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, Link, router } from "@inertiajs/react";
import { Doughnut } from "react-chartjs-2";
import { ArrowRight } from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

// Center text plugin for doughnut charts
const CenterTextPlugin = {
    id: "centerText",
    afterDraw(chart, args, options) {
        const {
            ctx,
            chartArea: { width, height },
        } = chart;
        const center = {
            x: chart.getDatasetMeta(0).data[0]?.x ?? width / 2,
            y: chart.getDatasetMeta(0).data[0]?.y ?? height / 2,
        };
        const lines = options?.lines || [];
        if (!lines.length) return;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const lineHeight = 18;
        const totalHeight = lineHeight * lines.length;
        const startY = center.y - totalHeight / 2 + lineHeight / 2;
        lines.forEach((l, idx) => {
            const fontSize = l.fontSize || (idx === 0 ? 16 : 12);
            ctx.fillStyle = l.color || "#111827";
            ctx.font = `${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
            ctx.fillText(l.text, center.x, startY + idx * lineHeight);
        });
        ctx.restore();
    },
};
ChartJS.register(CenterTextPlugin);

export default function StaffDashboard() {
    const { props } = usePage();
    const {
        user,
        staffDorm,
        fineStats = [],
        upcomingEvent,
        maintenanceStats = [],
        complaintStats = [],
        currentVisitors = [],
        routes = {},
    } = props;

    const fineLabelsAll = fineStats.map((f) => f.label);
    const fineCountsAll = fineStats.map((f) => f.count);
    const fineAmountsAll = fineStats.map((f) => f.amount);
    const createdIdx = fineLabelsAll.findIndex((L) => L === "Created");
    const createdCount = createdIdx >= 0 ? fineCountsAll[createdIdx] || 0 : 0;
    const createdAmount = createdIdx >= 0 ? fineAmountsAll[createdIdx] || 0 : 0;
    const fineLabels = fineStats
        .filter((f) => f.label !== "Created")
        .map((f) => f.label);
    const fineCounts = fineStats
        .filter((f) => f.label !== "Created")
        .map((f) => f.count);
    const fineAmounts = fineStats
        .filter((f) => f.label !== "Created")
        .map((f) => f.amount);
    const fineColors = fineLabels.map((L) => {
        if (L === "Paid") return "#34d399";
        if (L === "Waived") return "#a3a3a3";
        if (L === "Not Paid") return "#f87171";
        return "#6366f1"; // Created (neutral indigo)
    });
    const fineChartData = {
        labels: fineLabels,
        datasets: [
            {
                label: "Fines (count)",
                data: fineCounts,
                backgroundColor: fineColors,
                borderWidth: 0,
            },
        ],
    };
    const fineChartOptions = {
        responsive: true,
        cutout: "60%",
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        const idx = ctx.dataIndex;
                        const count = fineCounts[idx] || 0;
                        const amount = fineAmounts[idx] || 0;
                        return [
                            `Count: ${count}`,
                            `Amount: RM ${amount.toFixed(2)}`,
                        ];
                    },
                },
            },
            centerText: {
                lines: [
                    { text: `${createdCount} Fines`, fontSize: 16 },
                    {
                        text: `RM ${Number(createdAmount || 0).toFixed(2)}`,
                        fontSize: 12,
                        color: "#6b7280",
                    },
                ],
            },
        },
        onClick: (evt, elements) => {
            if (!elements?.length) return;
            const idx = elements[0].index;
            const label = fineLabels[idx];
            let status = null;
            if (label === "Paid") status = "paid";
            if (label === "Waived") status = "waived";
            if (label === "Not Paid") status = "not_paid";
            if (status) {
                const url = `${
                    routes.finesIndex
                }?tab=list&status=${encodeURIComponent(status)}`;
                window.location.href = url;
            }
        },
    };

    const maintenanceLabels = maintenanceStats.map((m) =>
        prettyStatus(m.status)
    );
    const maintenanceCounts = maintenanceStats.map((m) => m.count);
    const maintenanceColors = maintenanceStats.map((m) =>
        colorForMaintenance(m.status)
    );
    const maintenanceChartData = {
        labels: maintenanceLabels,
        datasets: [
            {
                label: "Maintenance",
                data: maintenanceCounts,
                backgroundColor: maintenanceColors,
                borderWidth: 0,
            },
        ],
    };
    const maintenanceTotal = maintenanceCounts.reduce((a, b) => a + b, 0);
    const maintenanceChartOptions = {
        responsive: true,
        cutout: "60%",
        plugins: {
            legend: { display: false },
            centerText: {
                lines: [
                    { text: `${maintenanceTotal}`, fontSize: 16 },
                    { text: "Maintenance", fontSize: 12, color: "#6b7280" },
                ],
            },
        },
        onClick: (evt, elements) => {
            if (!elements?.length) return;
            const first = elements[0];
            const index = first.index;
            const status = (maintenanceStats[index] || {}).status;
            if (status) {
                const url = `${
                    routes.maintenanceIndex
                }?status=${encodeURIComponent(status)}`;
                window.location.href = url;
            }
        },
    };

    const complaintLabels = complaintStats.map((c) => prettyStatus(c.status));
    const complaintCounts = complaintStats.map((c) => c.count);
    const complaintColors = complaintStats.map((c) =>
        colorForComplaint(c.status)
    );
    const complaintChartData = {
        labels: complaintLabels,
        datasets: [
            {
                label: "Complaints",
                data: complaintCounts,
                backgroundColor: complaintColors,
                borderWidth: 0,
            },
        ],
    };
    const complaintsTotal = complaintCounts.reduce((a, b) => a + b, 0);
    const complaintChartOptions = {
        responsive: true,
        cutout: "60%",
        plugins: {
            legend: { display: false },
            centerText: {
                lines: [
                    { text: `${complaintsTotal}`, fontSize: 16 },
                    { text: "Complaints", fontSize: 12, color: "#6b7280" },
                ],
            },
        },
        onClick: (evt, elements) => {
            if (!elements?.length) return;
            const first = elements[0];
            const index = first.index;
            const status = (complaintStats[index] || {}).status;
            if (status) {
                const url = `${
                    routes.complaintsIndex
                }?status=${encodeURIComponent(status)}`;
                window.location.href = url;
            }
        },
    };

    const handleCheckout = (id) => {
        if (!id) return;
        router.patch(
            `/staff/visitors/${id}/checkout`,
            {},
            { preserveScroll: true }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Staff Dashboard
                    </h2>
                </div>
            }
        >
            <Head title="Staff Dashboard" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <div className="text-2xl font-bold text-violet-800">
                            Welcome, <span className="text-indigo-600">{user?.name}</span>!
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                            You're a staff of <span className="font-semibold text-violet-700">{staffDorm?.name}</span>.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {/* Maintenance Status Donut */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Maintenance by Status
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        Click to filter
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <Doughnut
                                        data={maintenanceChartData}
                                        options={maintenanceChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Complaint Status Donut */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Complaints by Status
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        Click to filter
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <Doughnut
                                        data={complaintChartData}
                                        options={complaintChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fines Donut */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Fines This Year
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        Click to filter
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <Doughnut
                                        data={fineChartData}
                                        options={fineChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Event by Staff (second row) */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg md:col-span-1 xl:col-span-1">
                            <div className="p-6 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Your Upcoming Event
                                    </h3>
                                    {upcomingEvent && (
                                        <div className="text-xs text-gray-600">
                                            <span className="font-medium">
                                                {getRegisteredCount(
                                                    upcomingEvent
                                                )}
                                            </span>{" "}
                                            / {upcomingEvent.capacity || 0}
                                        </div>
                                    )}
                                </div>
                                {upcomingEvent ? (
                                    <div className="space-y-1 text-sm">
                                        <div className="font-medium">
                                            {upcomingEvent.name}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {visibilityLabelFor(upcomingEvent)}
                                        </div>
                                        <div className="text-xs text-gray-600 flex items-center gap-1">
                                            <span>
                                                {formatDateShort(
                                                    upcomingEvent.registration_opens_at
                                                )}
                                            </span>
                                            <ArrowRight
                                                size={14}
                                                className="text-gray-400"
                                            />
                                            <span>
                                                {formatDateShort(
                                                    upcomingEvent.registration_closes_at
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 flex items-center gap-1">
                                            <span>
                                                {formatDateShort(
                                                    upcomingEvent.starts_at
                                                )}
                                            </span>
                                            <ArrowRight
                                                size={14}
                                                className="text-gray-400"
                                            />
                                            <span>
                                                {formatDateShort(
                                                    upcomingEvent.ends_at
                                                )}
                                            </span>
                                        </div>
                                        <div className="pt-3">
                                            <Link
                                                href={`/staff/events/${upcomingEvent.id}`}
                                                className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600">
                                        No upcoming event you created.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Current Visitors (not checked out) */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg md:col-span-1 xl:col-span-2">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Current Visitors (On-site)
                                    </h3>
                                </div>
                                <div className="mt-4 divide-y">
                                    {(currentVisitors || []).map((v) => (
                                        <div
                                            key={v.id}
                                            className="py-3 text-sm flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {v.visitor_name}
                                                </div>
                                                <div className="text-gray-600">
                                                    {v.company
                                                        ? `${v.company} • `
                                                        : ""}
                                                    {v.phone
                                                        ? `${v.phone} • `
                                                        : ""}
                                                    Arrived:{" "}
                                                    {formatDate(v.arrival_time)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleCheckout(v.id)
                                                }
                                                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                                            >
                                                Check Out
                                            </button>
                                        </div>
                                    ))}
                                    {(currentVisitors || []).length === 0 && (
                                        <p className="text-sm text-gray-600">
                                            No current visitors on-site.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function prettyStatus(s) {
    if (!s) return "";
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function colorForMaintenance(status) {
    switch (status) {
        case "submitted":
            return "#a3a3a3";
        case "reviewed":
            return "#60a5fa";
        case "in_progress":
            return "#fbbf24";
        case "completed":
            return "#34d399";
        default:
            return "#9ca3af";
    }
}

function colorForComplaint(status) {
    switch (status) {
        case "submitted":
            return "#a3a3a3";
        case "reviewed":
            return "#60a5fa";
        case "in_progress":
            return "#fbbf24";
        case "resolved":
            return "#34d399";
        case "dropped":
            return "#f87171";
        default:
            return "#9ca3af";
    }
}

function getRegisteredCount(e) {
    const counts =
        e?.registration_count ?? e?.registrations_count ?? e?.attendees_count;
    if (typeof counts === "number") return counts;
    const regs = e?.registrations;
    if (Array.isArray(regs)) return regs.length;
    return 0;
}

function visibilityLabelFor(e, staffDorm) {
    const v = (e?.visibility || "").toLowerCase();
    if (v === "closed") {
        const code = (staffDorm?.code || "").toUpperCase();
        return code ? `${code} Only` : "Dorm Only";
    }
    return (v || "open")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateShort(dt) {
    if (!dt) return "-";
    try {
        const d = new Date(dt);
        const date = d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const time = d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${date} • ${time}`;
    } catch {
        return String(dt);
    }
}

function formatDate(value) {
    if (!value) return "";
    try {
        const d = new Date(value);
        return d.toLocaleString();
    } catch (e) {
        return String(value);
    }
}
