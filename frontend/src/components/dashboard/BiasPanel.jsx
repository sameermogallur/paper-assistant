import React from 'react';
import { motion } from "framer-motion";
import { Scale, ArrowLeft, ArrowRight, Minus } from "lucide-react";

export default function BiasPanel({ biasAnalysis = {} }) {
  const {
    political_score = 0,
    political_label = 'Center',
    general_score = 0,
    general_label = 'Neutral',
    indicators = []
  } = biasAnalysis;

  // Political spectrum position (0-100 where 50 is center)
  const politicalPosition = ((political_score + 100) / 200) * 100;

  const getPoliticalColor = (score) => {
    if (score < -50) return 'text-blue-700';
    if (score < -20) return 'text-blue-500';
    if (score < 20) return 'text-slate-600';
    if (score < 50) return 'text-red-500';
    return 'text-red-700';
  };

  const getGeneralBiasColor = (score) => {
    if (score < 20) return 'emerald';
    if (score < 40) return 'blue';
    if (score < 60) return 'amber';
    if (score < 80) return 'orange';
    return 'red';
  };

  const generalColor = getGeneralBiasColor(general_score);

  return (
    <div className="space-y-8">
      {/* Political Bias */}
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Scale className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900">Political Bias</h3>
        </div>

        {/* Political Spectrum */}
        <div className="relative mb-4">
          {/* Labels */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-blue-600 font-medium flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Left
            </span>
            <span className="text-slate-500">Center</span>
            <span className="text-red-600 font-medium flex items-center gap-1">
              Right <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          {/* Spectrum Bar */}
          <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-slate-200 to-red-500">
            {/* Position Marker */}
            <motion.div
              initial={{ left: '50%' }}
              animate={{ left: `${politicalPosition}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            >
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-800 shadow-lg" />
            </motion.div>
          </div>

          {/* Score Display */}
          <div className="text-center mt-4">
            <p className={`text-2xl font-bold ${getPoliticalColor(political_score)}`}>
              {political_label}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Score: {political_score > 0 ? '+' : ''}{political_score}
            </p>
          </div>
        </div>
      </div>

      {/* General Bias */}
      <div className="p-6 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Minus className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900">General Bias Level</h3>
        </div>

        {/* Bias Meter */}
        <div className="relative mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-emerald-600">Neutral</span>
            <span className="text-amber-600">Moderate</span>
            <span className="text-red-600">Strong</span>
          </div>

          <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${general_score}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500`}
            />
          </div>

          <div className="text-center mt-4">
            <p className={`text-2xl font-bold text-${generalColor}-600`}>
              {general_label}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {general_score}% bias detected
            </p>
          </div>
        </div>
      </div>

      {/* Bias Indicators */}
      {indicators.length > 0 && (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-4">Detected Indicators</h4>
          <div className="space-y-3">
            {indicators.map((indicator, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-white border border-slate-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">{indicator.type}</p>
                    <p className="text-sm text-slate-500 mt-1">{indicator.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full bg-${indicator.severity === 'high' ? 'red' : indicator.severity === 'medium' ? 'amber' : 'blue'}-100 text-${indicator.severity === 'high' ? 'red' : indicator.severity === 'medium' ? 'amber' : 'blue'}-700`}>
                    {indicator.severity}
                  </span>
                </div>
                {indicator.excerpt && (
                  <p className="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3">
                    "{indicator.excerpt}"
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}