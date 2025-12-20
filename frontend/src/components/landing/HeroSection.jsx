import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, FileSearch } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection({ onGetStarted }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50" />
      
      {/* Floating Orbs */}
      <motion.div 
        className="absolute top-20 left-20 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl"
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl"
        animate={{ 
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-slate-700">AI-Powered Research Integrity</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6"
        >
          Stop losing hours to
          <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
            manual citation checks
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          AIRA analyzes research papers in seconds — verifying citations, extracting statistics, 
          and scoring research integrity.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5"
          >
            Analyze Your Paper
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="h-14 px-8 text-lg border-slate-200 hover:bg-slate-50"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See How It Works
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-500"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">Fact-Checked Sources</span>
          </div>
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-indigo-500" />
            <span className="text-sm">PDF Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span className="text-sm">AI-Powered Analysis</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}