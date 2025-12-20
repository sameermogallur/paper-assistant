import React from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Newspaper, AlertTriangle } from "lucide-react";

export default function ContentTypeSelector({ contentType, onSelect, suggestedType, domainWarning }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 text-center">What type of content is this?</p>
      
      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('research')}
          className={`relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
            contentType === 'research'
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${contentType === 'research' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="font-medium">Research Paper</span>
          {suggestedType === 'research' && (
            <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs">
              Suggested
            </Badge>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => alert('News analysis coming soon!')}
          className="relative flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
          disabled
        >
          <Newspaper className="w-5 h-5 text-slate-300" />
          <span className="font-medium">News Article</span>
          <Badge className="absolute -top-2 -right-2 bg-slate-400 text-white text-xs">
            Coming Soon
          </Badge>
        </motion.button>
      </div>

      {domainWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{domainWarning}</span>
        </motion.div>
      )}
    </div>
  );
}