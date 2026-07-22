import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Hash } from "lucide-react";
import { format } from "date-fns";
import { gradeBadgeClass } from "@/lib/grades";

export default function PaperCard({ paper, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <Link to={`/papers/${paper.id}`} className="flex-1 min-w-0 group">
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {paper.title || 'Untitled paper'}
          </h3>
        </Link>
        {paper.integrity_grade && (
          <Badge className={`${gradeBadgeClass(paper.integrity_grade)} text-white shrink-0`}>
            {paper.integrity_grade}
          </Badge>
        )}
      </div>

      {paper.authors?.length > 0 && (
        <p className="text-sm text-slate-600 line-clamp-1">{paper.authors.join(', ')}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-auto">
        {paper.year && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {paper.year}
          </span>
        )}
        {paper.word_count != null && (
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {paper.word_count.toLocaleString()} words
          </span>
        )}
        {paper.created_at && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Added {format(new Date(paper.created_at), 'MMM d, yyyy')}
          </span>
        )}
        {paper.integrity_score != null && (
          <span className="ml-auto font-medium text-slate-700">
            {paper.integrity_score}/100
          </span>
        )}
      </div>

      {actions && <div className="pt-2 border-t border-slate-100">{actions}</div>}
    </motion.div>
  );
}
