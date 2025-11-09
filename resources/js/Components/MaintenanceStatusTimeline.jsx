import React from 'react';

const steps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function MaintenanceStatusTimeline({ status, timestamps = {} }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {steps.map((s, idx) => {
        const activeIndex = steps.findIndex(st => st.key === status);
        const isDone = idx <= activeIndex;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`text-xs px-2 py-1 rounded border ${isDone ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`}> 
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
