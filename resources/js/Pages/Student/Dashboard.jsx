import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, Link } from "@inertiajs/react";
import { useState } from 'react';
import { Users, Clock, Calendar, MoreHorizontal } from 'lucide-react';
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

const CenterTextPlugin = {
  id: "centerText",
  afterDraw(chart, args, options) {
    const { ctx, chartArea: { width, height } } = chart;
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

export default function StudentDashboard() {
  const { props } = usePage();
  const {
    user,
    resident = false,
    residency = null,
    eventProgress = { year: new Date().getFullYear(), registered: 0, attended: 0 },
    maintenanceStats = [],
    complaintStats = [],
    fineStats = [],
    upcomingRegisteredEvent,
    routes = {},
    profileComplete = true,
    roommates = [],
  } = props;

  const [expandedHobbies, setExpandedHobbies] = useState({});
  const HOBBY_DISPLAY_LIMIT = 4;

  const toggleHobbies = (id) => {
    setExpandedHobbies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Fines donut (exclude Created from slices)
  const fineLabelsAll = fineStats.map((f) => f.label);
  const fineCountsAll = fineStats.map((f) => f.count);
  const fineAmountsAll = fineStats.map((f) => f.amount);
  const createdIdx = fineLabelsAll.findIndex((L) => L === "Created");
  const createdCount = createdIdx >= 0 ? (fineCountsAll[createdIdx] || 0) : 0;
  const createdAmount = createdIdx >= 0 ? (fineAmountsAll[createdIdx] || 0) : 0;
  const fineLabels = fineStats.filter((f) => f.label !== "Created").map((f) => f.label);
  const fineCounts = fineStats.filter((f) => f.label !== "Created").map((f) => f.count);
  const fineColors = fineLabels.map((L) => {
    if (L === "Paid") return "#34d399";
    if (L === "Waived") return "#a3a3a3";
    if (L === "Unpaid") return "#f87171";
    if (L === "Pending") return "#fbbf24";
    return "#6366f1";
  });
  const fineChartData = {
    labels: fineLabels,
    datasets: [{ data: fineCounts, backgroundColor: fineColors, borderWidth: 0 }],
  };
  const fineChartOptions = {
    responsive: true,
    cutout: "60%",
    plugins: {
      legend: { display: false },
      centerText: {
        lines: [
          { text: `${createdCount} Fines`, fontSize: 16 },
          { text: `RM ${Number(createdAmount || 0).toFixed(2)}`, fontSize: 12, color: "#6b7280" },
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
      if (label === "Unpaid") status = "unpaid";
      if (label === "Pending") status = "pending";
      if (status) {
        const url = `${routes.finesIndex}?status=${encodeURIComponent(status)}`;
        window.location.href = url;
      }
    },
  };

  // Maintenance donut (student only)
  const maintenanceLabels = maintenanceStats.map((m) => prettyStatus(m.status));
  const maintenanceCounts = maintenanceStats.map((m) => m.count);
  const maintenanceColors = maintenanceStats.map((m) => colorForMaintenance(m.status));
  const maintenanceChartData = {
    labels: maintenanceLabels,
    datasets: [{ data: maintenanceCounts, backgroundColor: maintenanceColors, borderWidth: 0 }],
  };
  const maintenanceTotal = maintenanceCounts.reduce((a, b) => a + b, 0);
  const maintenanceChartOptions = {
    responsive: true,
    cutout: "60%",
    plugins: {
      legend: { display: false },
      centerText: { lines: [{ text: `${maintenanceTotal}` }, { text: "Maintenance", color: "#6b7280" }] },
    },
    onClick: (evt, elements) => {
      if (!elements?.length) return;
      const i = elements[0].index;
      const status = (maintenanceStats[i] || {}).status;
      if (status) {
        const url = `${routes.maintenanceIndex}?status=${encodeURIComponent(status)}`;
        window.location.href = url;
      }
    },
  };

  // Complaints donut (student only)
  const complaintLabels = complaintStats.map((c) => prettyStatus(c.status));
  const complaintCounts = complaintStats.map((c) => c.count);
  const complaintColors = complaintStats.map((c) => colorForComplaint(c.status));
  const complaintChartData = {
    labels: complaintLabels,
    datasets: [{ data: complaintCounts, backgroundColor: complaintColors, borderWidth: 0 }],
  };
  const complaintsTotal = complaintCounts.reduce((a, b) => a + b, 0);
  const complaintChartOptions = {
    responsive: true,
    cutout: "60%",
    plugins: {
      legend: { display: false },
      centerText: { lines: [{ text: `${complaintsTotal}` }, { text: "Complaints", color: "#6b7280" }] },
    },
    onClick: (evt, elements) => {
      if (!elements?.length) return;
      const i = elements[0].index;
      const status = (complaintStats[i] || {}).status;
      if (status) {
        const url = `${routes.complaintsIndex}?status=${encodeURIComponent(status)}`;
        window.location.href = url;
      }
    },
  };

  // Event progress bar
  const reg = Number(eventProgress.registered || 0);
  const att = Math.min(Number(eventProgress.attended || 0), reg);
  const pct = reg > 0 ? Math.round((att / reg) * 100) : 0;

  return (
    <AuthenticatedLayout
      header={
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">Student Dashboard</h2>
        </div>
      }
    >
      <Head title="Student Dashboard" />
      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Profile completion alert (students only, when incomplete) */}
          {!profileComplete && (
            <div className="overflow-hidden bg-yellow-50 border border-yellow-200 text-yellow-800 shadow-sm sm:rounded-lg mb-4">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Complete Your Profile</div>
                  <p className="text-sm mt-1">For more personalized room assignment, please complete your profile details.</p>
                </div>
                <Link href={routes.profileEdit || "/profile"} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">Update Profile</Link>
              </div>
            </div>
          )}
          {/* Greeting */}
          <div className="mb-4">
            <div className="text-2xl font-bold text-violet-800">
              Welcome, <span className="text-indigo-600">{user?.name}</span>!
            </div>
            <div className="mt-1 text-xs text-gray-600">
              {resident && residency?.dorm?.name ? (
                <>You're a resident of <span className="font-semibold text-violet-700">{residency.dorm.name}</span>.</>
              ) : (
                <>You're not currently a resident of any dorm.</>
              )}
            </div>
          </div>

          {/* Residency + Upcoming row (residents only) */}
          {resident && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
              {/* Left column: Residency (1/3) */}
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Your Residency</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${residency?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{residency?.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <div className="text-gray-600">Residency Period</div>
                      <div className="font-medium">{formatDateOnly(residency?.check_in_date)} → {formatDateOnly(residency?.check_out_date) || 'Present'}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Block & Room</div>
                      <div className="font-medium">{residency?.block?.name || '-'} • {residency?.room?.number || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Assigned By</div>
                      <div className="font-medium">{residency?.assigned_by || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right columns: Upcoming Registered Event (2/3) */}
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg md:col-span-2">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Your Upcoming Registered Event</h3>
                  </div>
                  <div className="mt-2 text-sm">
                    {upcomingRegisteredEvent ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{upcomingRegisteredEvent.name}</div>
                          <div className="text-gray-600">{formatDate(upcomingRegisteredEvent.starts_at)} → {formatDate(upcomingRegisteredEvent.ends_at)}</div>
                        </div>
                        <Link href={`${routes.eventsShow}/${upcomingRegisteredEvent.id}`} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">View</Link>
                      </div>
                    ) : (
                      <p className="text-gray-600">No upcoming registered events.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resident: Event progress full-width */}
          {resident && (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Events {eventProgress?.year}</h3>
                  <span className="text-xs text-gray-600">Attended vs Registered</span>
                </div>
                <div className="mt-4">
                  <div className="text-sm mb-1 text-right">{att} / {reg} Attended ({pct}%)</div>
                  <div className="w-full h-3 rounded bg-gray-200 overflow-hidden">
                    <div className="h-3 bg-indigo-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roommates card (active residency only) */}
          {resident && residency?.is_active && (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Your Roommates</h3>
                </div>
                <div className="mt-2 text-sm">
                  {Array.isArray(roommates) && roommates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {roommates.map((rm) => {
                        const hobbies = Array.isArray(rm.hobbies) ? rm.hobbies : [];
                        const expanded = !!expandedHobbies[rm.id];
                        return (
                          <div key={rm.id} className="rounded p-3 bg-white shadow-md ring-1 ring-violet-100">
                            <div>
                              <div className="text-sm font-semibold truncate" title={rm.name}>{rm.name}</div>
                              <div className="text-xs text-gray-500">{(rm.faculty_code || rm.faculty) ? `${rm.faculty_code || rm.faculty} - ${rm.intake_session || '-'} ` : (rm.intake_session || '-')}</div>
                              <div className="mt-3 text-xs text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4" /> <span>{formatDateOnly(rm.check_in_date)} → {rm.check_out_date ? formatDateOnly(rm.check_out_date) : 'Present'}</span></div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                <div className="flex items-center gap-1"><Users className="w-4 h-4" /> <span className="capitalize">{(rm.interaction_style || '').replace(/_/g, ' ') || '-'}</span></div>
                                <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> <span className="capitalize">{(rm.daily_schedule || '').replace(/_/g, ' ') || '-'}</span></div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {hobbies.slice(0, expanded ? hobbies.length : HOBBY_DISPLAY_LIMIT).map((h, idx) => (
                                  <span key={idx} className="text-[12px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{h ? (h.charAt(0).toUpperCase() + h.slice(1)) : h}</span>
                                ))}
                                {hobbies.length > HOBBY_DISPLAY_LIMIT && (
                                  <button type="button" onClick={() => toggleHobbies(rm.id)} className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"><MoreHorizontal className="w-3 h-3" /> {expanded ? 'Show less' : `+${hobbies.length - HOBBY_DISPLAY_LIMIT} more`}</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">No roommates currently.</p>
                  )}
                </div>
              </div>
            </div>
          )}



          {/* Non-resident: 2-row grid with fines spanning (JOIN+UPCOMING first row, EVENTS second row) */}
          {!resident && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
              {/* Row 1: Join OPEN (col1) and Upcoming (col2) */}
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6 min-h-28 flex flex-col justify-center">
                  <h3 className="font-semibold">Join OPEN Events</h3>
                  <p className="text-sm text-gray-600 mt-1">You're not a current resident, but you can still join OPEN events.</p>
                  <div className="pt-3">
                    <Link href={routes.eventsIndex} className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">Browse Events</Link>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6 min-h-28 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Your Upcoming Registered Event</h3>
                  </div>
                  <div className="mt-2 text-sm">
                    {upcomingRegisteredEvent ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{upcomingRegisteredEvent.name}</div>
                          <div className="text-gray-600">{formatDate(upcomingRegisteredEvent.starts_at)} → {formatDate(upcomingRegisteredEvent.ends_at)}</div>
                        </div>
                        <Link href={`${routes.eventsShow}/${upcomingRegisteredEvent.id}`} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">View</Link>
                      </div>
                    ) : (
                      <p className="text-gray-600">No upcoming registered events.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fines: span 2 rows in 3rd col */}
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg md:row-span-2">
                <div className="p-6 min-h-28 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Your Fines</h3>
                    <span className="text-xs text-gray-500">Click to filter</span>
                  </div>
                  <div className="mt-4">
                    <Doughnut data={fineChartData} options={fineChartOptions} />
                  </div>
                </div>
              </div>

              {/* Row 2: Event progress spans 2 cols */}
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg md:col-span-2">
                <div className="p-6 min-h-28 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Events {eventProgress?.year}</h3>
                    <span className="text-xs text-gray-600">Attended vs Registered</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm mb-1 text-right">{att} / {reg} Attended ({pct}%)</div>
                    <div className="w-full h-3 rounded bg-gray-200 overflow-hidden">
                      <div className="h-3 bg-indigo-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Second row: Donut charts side-by-side (residents only) */}
          {resident && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Your Fines</h3>
                    <span className="text-xs text-gray-500">Click to filter</span>
                  </div>
                  <div className="mt-4">
                    <Doughnut data={fineChartData} options={fineChartOptions} />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">My Maintenance</h3>
                    <span className="text-xs text-gray-500">Click to filter</span>
                  </div>
                  <div className="mt-4">
                    <Doughnut data={maintenanceChartData} options={maintenanceChartOptions} />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">My Complaints</h3>
                    <span className="text-xs text-gray-500">Click to filter</span>
                  </div>
                  <div className="mt-4">
                    <Doughnut data={complaintChartData} options={complaintChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Removed separate upcoming + CTA row; unified above */}
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

function formatDateOnly(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

function formatDate(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${date} • ${time}`;
  } catch {
    return String(dt);
  }
}
