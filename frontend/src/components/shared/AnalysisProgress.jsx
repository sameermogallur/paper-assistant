import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { 
  FileText, 
  Search, 
  BarChart3, 
  Award, 
  Brain, 
  CheckCircle2 
} from "lucide-react";

const defaultSteps = [
  { id: 'parsing', label: 'Parsing Content', icon: FileText },
  { id: 'citations', label: 'Verifying Sources', icon: Search },
  { id: 'statistics', label: 'Extracting Data', icon: BarChart3 },
  { id: 'quality', label: 'Calculating Quality Score', icon: Award },
  { id: 'summary', label: 'Generating AI Summary', icon: Brain },
  { id: 'complete', label: 'Analysis Complete', icon: CheckCircle2 }
];

export default function AnalysisProgress({ onComplete, isNews = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = defaultSteps;

  useEffect(() => {
    const stepDurations = [1500, 2000, 1800, 1200, 2500, 500];
    
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, stepDurations[currentStep]);
      return () => clearTimeout(timer);
    } else if (currentStep === steps.length - 1) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index <= currentStep ? 1 : 0.3,
                x: 0 
              }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                isActive ? 'bg-indigo-50 border border-indigo-200' :
                isComplete ? 'bg-emerald-50 border border-emerald-200' :
                'bg-slate-50 border border-slate-100'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                isActive ? 'bg-indigo-100' :
                isComplete ? 'bg-emerald-100' :
                'bg-slate-100'
              }`}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`} />
                )}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  isActive ? 'text-indigo-900' :
                  isComplete ? 'text-emerald-900' :
                  'text-slate-500'
                }`}>
                  {step.label}
                </p>
              </div>

              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-1"
                >
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-600"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity,
                        delay: dot * 0.2 
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}