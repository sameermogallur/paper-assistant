import React from 'react';
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Minus } from "lucide-react";

const gradeColors = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' },
  B: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50' },
  C: { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50' },
  D: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' },
  F: { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50' }
};

export default function QualityGauge({ score = 0, grade = 'C', breakdown = [] }) {
  const colors = gradeColors[grade] || gradeColors.C;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-8">
      {/* Main Score */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Circular Gauge */}
        <div className="relative">
          <svg width="180" height="180" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className={colors.text}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className={`text-5xl font-bold ${colors.text}`}
            >
              {score}
            </motion.span>
            <span className="text-sm text-slate-500">out of 100</span>
          </div>
        </div>

        {/* Grade & Description */}
        <div className="text-center md:text-left">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center`}
            >
              <span className="text-3xl font-bold text-white">{grade}</span>
            </motion.div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {grade === 'A' && 'Excellent Quality'}
                {grade === 'B' && 'Good Quality'}
                {grade === 'C' && 'Average Quality'}
                {grade === 'D' && 'Below Average'}
                {grade === 'F' && 'Needs Improvement'}
              </h3>
              <p className="text-slate-500">
                {grade === 'A' && 'This paper demonstrates strong research practices'}
                {grade === 'B' && 'Generally well-conducted research with minor gaps'}
                {grade === 'C' && 'Some areas need attention before publication'}
                {grade === 'D' && 'Several concerns identified that need addressing'}
                {grade === 'F' && 'Significant issues found in methodology or reporting'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mt-6">
        <p className="text-sm text-blue-800 text-center">
          <strong>What this score measures:</strong> Transparency and reporting practices 
          (ethics statements, limitations, conflicts of interest, data availability). 
          This is not a measure of research validity or correctness.
        </p>
      </div>

      {/* Breakdown */}
      {breakdown.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">Score Breakdown</h4>
          <div className="space-y-2">
            {breakdown.map((item, index) => {
              const percentage = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
              
              return (
                <motion.div
                  key={item.criterion}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.status === 'pass' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {item.status === 'fail' && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      {item.status === 'partial' && (
                        <Minus className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="font-medium text-slate-700">{item.criterion}</span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {item.score} / {item.maxScore}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className={`h-full rounded-full ${
                        percentage >= 80 ? 'bg-emerald-500' :
                        percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}