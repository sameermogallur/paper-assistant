import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Building2
} from "lucide-react";

export default function TrustPanel({ trustAnalysis = {} }) {
  const {
    score = 70,
    grade = 'B',
    source_reputation = 'Established',
    claims_verified = 0,
    claims_unverified = 0,
    claims_disputed = 0,
    fact_checks = []
  } = trustAnalysis;

  const [expandedClaim, setExpandedClaim] = useState(null);

  const gradeColors = {
    A: 'emerald',
    B: 'blue',
    C: 'amber',
    D: 'orange',
    F: 'red'
  };

  const gradeColor = gradeColors[grade] || 'slate';

  const getVerdictIcon = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'verified':
      case 'true':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'disputed':
      case 'false':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getVerdictColor = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'verified':
      case 'true':
        return 'emerald';
      case 'disputed':
      case 'false':
        return 'red';
      default:
        return 'amber';
    }
  };

  const totalClaims = claims_verified + claims_unverified + claims_disputed;

  return (
    <div className="space-y-6">
      {/* Trust Score Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900">Trust Assessment</h3>
        </div>

        <div className="flex items-center gap-8">
          {/* Score Circle */}
          <div className="relative">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="10"
              />
              <motion.circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                className={`text-${gradeColor}-500`}
                strokeDasharray={301.6}
                initial={{ strokeDashoffset: 301.6 }}
                animate={{ strokeDashoffset: 301.6 - (score / 100) * 301.6 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold text-${gradeColor}-600`}>{grade}</span>
              <span className="text-sm text-slate-500">{score}/100</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Source Reputation:</span>
              <Badge className={`bg-${gradeColor}-100 text-${gradeColor}-700 border-0`}>
                {source_reputation}
              </Badge>
            </div>

            {totalClaims > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <p className="text-lg font-bold text-emerald-600">{claims_verified}</p>
                  <p className="text-xs text-emerald-700">Verified</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50">
                  <p className="text-lg font-bold text-amber-600">{claims_unverified}</p>
                  <p className="text-xs text-amber-700">Unverified</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50">
                  <p className="text-lg font-bold text-red-600">{claims_disputed}</p>
                  <p className="text-xs text-red-700">Disputed</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fact Checks */}
      {fact_checks.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">Fact-Checked Claims</h4>
          
          {fact_checks.map((check, index) => {
            const isExpanded = expandedClaim === index;
            const verdictColor = getVerdictColor(check.verdict);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl bg-white border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedClaim(isExpanded ? null : index)}
                  className="w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  {getVerdictIcon(check.verdict)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 line-clamp-2">{check.claim}</p>
                    <Badge className={`mt-2 bg-${verdictColor}-100 text-${verdictColor}-700 border-0`}>
                      {check.verdict}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
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
                      <div className="p-4 space-y-3 bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1">Explanation</p>
                          <p className="text-slate-700">{check.explanation}</p>
                        </div>
                        
                        {check.source && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Source:</span>
                            <a
                              href="#"
                              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              {check.source}
                              <ExternalLink className="w-3 h-3" />
                            </a>
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

      {/* Disclaimer */}
      <div className="p-4 rounded-lg bg-slate-100 border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Note:</strong> Trust scores are generated using AI analysis and publicly available information. 
          Results should be verified with primary sources. Full fact-checking API integration coming soon.
        </p>
      </div>
    </div>
  );
}