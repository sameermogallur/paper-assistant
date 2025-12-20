import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function StatisticsPanel({ statistics = [], redFlags = [], goodPractices = [] }) {
  return (
    <div className="space-y-8">
      {/* Statistics Extracted */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Extracted Statistics</h3>
        {statistics && statistics.length > 0 ? (
          <div className="grid gap-3">
            {statistics.map((stat, index) => (
              <div 
                key={index} 
                className="flex items-start justify-between p-4 bg-white border border-slate-200 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                      {stat.type?.replace(/_/g, ' ') || 'Statistic'}
                    </span>
                  </div>
                  <p className="font-mono text-lg text-slate-900">{stat.value}</p>
                  {stat.context && stat.context !== 'Extracted from paper' && (
                    <p className="text-sm text-slate-500 mt-1">{stat.context}</p>
                  )}
                </div>
                {stat.flag && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    {stat.flag}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">No statistics extracted from this paper.</p>
          </div>
        )}
      </div>

      {/* Red Flags */}
      {redFlags && redFlags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Concerns Identified
          </h3>
          <div className="space-y-2">
            {redFlags.map((flag, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-amber-800">{flag.replace(/^[❌⚠️🚩]\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Good Practices */}
      {goodPractices && goodPractices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Good Practices Found
          </h3>
          <div className="space-y-2">
            {goodPractices.map((practice, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-emerald-800">{practice.replace(/^✅\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-xl">
        <p className="text-sm text-slate-600 text-center">
          <strong>Note:</strong> Statistics are extracted using pattern matching. 
          Always verify important values against the original paper.
        </p>
      </div>
    </div>
  );
}
