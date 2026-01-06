import React from 'react';

const steps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function MaintenanceStatusTimeline({ status, timestamps = {} }) {
  const solidClassesFor = (key) => {
    switch (key) {
      case 'submitted':
        return 'bg-gray-600 text-white border-gray-600';
      case 'reviewed':
        return 'bg-sky-600 text-white border-sky-600';
      case 'in_progress':
        return 'bg-amber-600 text-white border-amber-600';
      case 'completed':
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
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {steps.map((s, idx) => {
        const activeIndex = steps.findIndex(st => st.key === status);
        const isDone = idx <= activeIndex;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`text-xs px-2 py-1 rounded border ${isDone ? solidClassesFor(s.key) : outlineClassesFor(s.key)}`}> 
              {s.label}
            </div>
            {timestamps[s.key + '_at'] && (
              <span className="text-[10px] text-gray-500">{new Date(timestamps[s.key + '_at']).toLocaleString()}</span>
            )}
            {idx < steps.length - 1 && <span className="text-gray-400 text-xs">→</span>}
          </div>
        );
      })}
    </div>
  );
}
