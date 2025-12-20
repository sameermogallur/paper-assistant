import React from 'react';
import { motion } from "framer-motion";
import { FileText, Link2 } from "lucide-react";

export default function InputSelector({ inputType, onSelect }) {
  return (
    <div className="flex justify-center gap-4 mb-8">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect('pdf')}
        className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
          inputType === 'pdf'
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        }`}
      >
        <FileText className={`w-5 h-5 ${inputType === 'pdf' ? 'text-indigo-600' : 'text-slate-400'}`} />
        <div className="text-left">
          <p className="font-medium">Upload PDF</p>
          <p className="text-sm opacity-70">Research papers, reports</p>
        </div>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {}}
        disabled={true}
        className="flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all opacity-50 cursor-not-allowed border-slate-200 bg-white text-slate-600"
      >
        <Link2 className="w-5 h-5 text-slate-400" />
        <div className="text-left">
          <p className="font-medium flex items-center gap-2">
            Paste URL
            <span className="text-xs px-2 py-0.5 bg-slate-300 text-slate-600 rounded-full">Soon</span>
          </p>
          <p className="text-sm opacity-70">News articles, web pages</p>
        </div>
      </motion.button>
    </div>
  );
}