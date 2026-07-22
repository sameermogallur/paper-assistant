import React from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calendar, 
  Hash, 
  Layers,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { gradeBadgeClass } from "@/lib/grades";

export default function PaperHeader({ paper, onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-slate-100"
    >
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>

        {/* Paper Info */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {paper?.title || 'Untitled Paper'}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Analyzed {format(new Date(paper?.created_date || new Date()), 'MMM d, yyyy')}</span>
              </div>
              {paper?.page_count && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{paper.page_count} pages</span>
                </div>
              )}
              {paper?.word_count && (
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  <span>{paper.word_count.toLocaleString()} words</span>
                </div>
              )}
            </div>

            {/* Detected Sections */}
            {paper?.sections_detected?.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">Sections:</span>
                <div className="flex flex-wrap gap-1.5">
                  {paper.sections_detected.map((section) => (
                    <Badge 
                      key={section} 
                      variant="secondary"
                      className="bg-slate-100 text-slate-600"
                    >
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 lg:flex-col lg:items-end">
            {paper?.quality_grade && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Quality Grade</span>
                <Badge className={`text-lg px-3 py-1 ${gradeBadgeClass(paper.quality_grade)} text-white`}>
                  {paper.quality_grade}
                </Badge>
              </div>
            )}
            
            {paper?.file_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                  View PDF
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}