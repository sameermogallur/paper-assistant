import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function LogicPanel({ logicAnalysis = {} }) {
  const {
    score = 75,
    fallacy_count = 0,
    fallacies = []
  } = logicAnalysis;

  const [expandedFallacy, setExpandedFallacy] = useState(null);

  const getScoreColor = (s) => {
    if (s >= 80) return 'emerald';
    if (s >= 60) return 'blue';
    if (s >= 40) return 'amber';
    return 'red';
  };

  const scoreColor = getScoreColor(score);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Logic Score Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Logical Soundness</h3>
          </div>
          <Badge className={`bg-${scoreColor}-100 text-${scoreColor}-700 border-0`}>
            {fallacy_count} fallacies detected
          </Badge>
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="8"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={`text-${scoreColor}-500`}
                strokeDasharray={251.2}
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (score / 100) * 251.2 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold text-${scoreColor}-600`}>{score}</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-slate-600">
              {score >= 80 && "This content demonstrates strong logical reasoning with minimal fallacies."}
              {score >= 60 && score < 80 && "Generally sound logic with some areas that could be improved."}
              {score >= 40 && score < 60 && "Several logical issues detected that may affect credibility."}
              {score < 40 && "Significant logical problems identified. Exercise caution with claims made."}
            </p>
            {fallacy_count === 0 && (
              <div className="flex items-center gap-2 mt-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">No logical fallacies detected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fallacies List */}
      {fallacies.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Detected Fallacies
          </h4>
          
          {fallacies.map((fallacy, index) => {
            const isExpanded = expandedFallacy === index;
            const severityColor = getSeverityColor(fallacy.severity);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl bg-white border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFallacy(isExpanded ? null : index)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${severityColor}-100 flex items-center justify-center`}>
                      <span className={`text-lg font-bold text-${severityColor}-600`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{fallacy.name}</p>
                      <Badge className={`mt-1 bg-${severityColor}-100 text-${severityColor}-700 border-0 text-xs`}>
                        {fallacy.severity} severity
                      </Badge>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-4 space-y-4 bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">What is this fallacy?</p>
                          <p className="text-slate-700">{fallacy.description}</p>
                        </div>
                        
                        {fallacy.excerpt && (
                          <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Found in text:</p>
                            <blockquote className="text-slate-600 italic border-l-3 border-indigo-300 pl-4 py-2 bg-white rounded-r-lg">
                              "{fallacy.excerpt}"
                            </blockquote>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}