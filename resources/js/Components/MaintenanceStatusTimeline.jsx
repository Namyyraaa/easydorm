import React from 'react';

const defaultSteps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function MaintenanceStatusTimeline({ status, timestamps = {}, actors = {}, steps = defaultSteps }) {
  const solidClassesFor = (key) => {
    switch (key) {
      case 'submitted':
        return 'bg-gray-600 text-white border-gray-600';
      case 'reviewed':
        return 'bg-sky-600 text-white border-sky-600';
      case 'in_progress':
        return 'bg-amber-600 text-white border-amber-600';
      case 'completed':
      case 'resolved':
        return 'bg-green-600 text-white border-green-600';
      default:
        return 'bg-gray-600 text-white border-gray-600';
    }
  };

  const outlineClassesFor = (key) => {
    switch (key) {
      case 'submitted':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'reviewed':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'completed':
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const barClassFor = (key, isDone) => {
    if (isDone) {
      switch (key) {
        case 'submitted': return 'bg-gray-600';
        case 'reviewed': return 'bg-sky-600';
        case 'in_progress': return 'bg-amber-600';
        case 'completed': return 'bg-green-600';
        case 'resolved': return 'bg-green-600';
        default: return 'bg-gray-600';
      }
    }
    return 'bg-gray-200';
  };

  const formatActor = (value) => {
    if (!value) return '—';
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.user && value.user.name) return value.user.name;
      return '—';
    }
    if (typeof value === 'number') {
      return `User #${value}`;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return '—';
  };

  const formatActorLabel = (value) => {
    const name = formatActor(value);
    if (name === '—' || name.startsWith('User #')) return name;
    return name.length > 30 ? name.slice(0, 30) + '....' : name;
  };

  const formatTs = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    } catch {
      return '—';
    }
  };
  return (
    <div className="w-full">
      {(() => { const colsClass = steps.length === 3 ? 'grid-cols-3' : 'grid-cols-4'; return (
        <div className={`grid ${colsClass} gap-0`}>
        {steps.map((s, idx) => {
          const activeIndex = steps.findIndex(st => st.key === status);
          const isDone = idx <= activeIndex;
          const rounded = idx === 0 ? 'rounded-l-full' : (idx === steps.length - 1 ? 'rounded-r-full' : '');
          return (
            <div key={s.key} className={`h-1.5 ${rounded} ${barClassFor(s.key, isDone)}`}></div>
          );
        })}
        </div>
      ); })()}
      {(() => { const colsClass = steps.length === 3 ? 'grid-cols-3' : 'grid-cols-4'; return (
        <div className={`mt-2 grid ${colsClass} gap-6`}>
        {steps.map((s, idx) => {
          const ts = timestamps[s.key + '_at'];
          return (
            <div key={s.key} className="flex flex-col">
              <div className="text-sm font-medium">{s.label}</div>
              <div className="mt-1 text-xs text-gray-600">{formatTs(ts)}</div>
              <div className="text-xs text-gray-700 whitespace-nowrap overflow-hidden">By: {formatActorLabel(actors[s.key])}</div>
            </div>
          );
        })}
        </div>
      ); })()}
    </div>
  );
}
