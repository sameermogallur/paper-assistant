import React from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Users,
  Percent,
  BarChart3
} from "lucide-react";

const statTypeIcons = {
  'p-value': Percent,
  'sample_size': Users,
  'effect_size': TrendingUp,
  'confidence_interval': BarChart3,
  'default': BarChart3
};

const statTypeColors = {
  'p-value': 'indigo',
  'sample_size': 'cyan',
  'effect_size': 'violet',
  'confidence_interval': 'emerald'
};

export default function StatisticsPanel({ statistics = [], redFlags = [], goodPractices = [] }) {
  const getFlagColor = (flag) => {
    if (flag?.includes('warning') || flag?.includes('small')) return 'amber';
    if (flag?.includes('error') || flag?.includes('suspicious')) return 'red';
    return 'slate';
  };

  return (
    <div className="space-y-8">
      {/* Red Flags & Good Practices */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Red Flags */}
        <div className="p-6 rounded-xl bg-red-50/50 border border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Red Flags</h3>
            <Badge className="ml-auto bg-red-100 text-red-700 border-0">
              {redFlags.length}
            </Badge>
          </div>
          {redFlags.length === 0 ? (
            <p className="text-sm text-red-600/70">No red flags detected</p>
          ) : (
            <ul className="space-y-2">
              {redFlags.map((flag, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-2 text-sm text-red-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  {flag}
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {/* Good Practices */}
        <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Good Practices</h3>
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0">
              {goodPractices.length}
            </Badge>
          </div>
          {goodPractices.length === 0 ? (
            <p className="text-sm text-emerald-600/70">No specific good practices detected</p>
          ) : (
            <ul className="space-y-2">
              {goodPractices.map((practice, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-2 text-sm text-emerald-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {practice}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Extracted Statistics */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Extracted Statistics</h3>
        {statistics.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No statistics extracted from this paper</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {statistics.map((stat, index) => {
              const Icon = statTypeIcons[stat.type] || statTypeIcons.default;
              const color = statTypeColors[stat.type] || 'slate';
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-${color}-100`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                          {stat.type?.replace('_', ' ')}
                        </span>
                        {stat.flag && (
                          <Badge className={`bg-${getFlagColor(stat.flag)}-100 text-${getFlagColor(stat.flag)}-700 border-0 text-xs`}>
                            {stat.flag}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                      {stat.context && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {stat.context}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}