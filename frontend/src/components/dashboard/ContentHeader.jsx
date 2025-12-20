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
  ExternalLink,
  Globe,
  Newspaper,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";

export default function ContentHeader({ content, onBack }) {
  const isNews = content?.source_type === 'news';
  const isUrl = content?.input_type === 'url';

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

        {/* Content Info */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex-1 min-w-0">
            {/* Type Badge */}
            <div className="flex items-center gap-2 mb-3">
              {isNews ? (
                <Badge className="bg-violet-100 text-violet-700 border-0 flex items-center gap-1">
                  <Newspaper className="w-3 h-3" />
                  News Article
                </Badge>
              ) : (
                <Badge className="bg-indigo-100 text-indigo-700 border-0 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Research Paper
                </Badge>
              )}
              {isUrl && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {content?.domain}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {content?.title || 'Untitled Content'}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Analyzed {format(new Date(content?.created_date || new Date()), 'MMM d, yyyy')}</span>
              </div>
              {content?.word_count && (
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  <span>{content.word_count.toLocaleString()} words</span>
                </div>
              )}
              {!isUrl && content?.page_count && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{content.page_count} pages</span>
                </div>
              )}
            </div>

            {/* Detected Sections (for research papers) */}
            {!isNews && content?.sections_detected?.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">Sections:</span>
                <div className="flex flex-wrap gap-1.5">
                  {content.sections_detected.map((section) => (
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
            {content?.quality_grade && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {isNews ? 'Trust Grade' : 'Quality Grade'}
                </span>
                <Badge className={`text-lg px-3 py-1 ${
                  content.quality_grade === 'A' ? 'bg-emerald-500' :
                  content.quality_grade === 'B' ? 'bg-blue-500' :
                  content.quality_grade === 'C' ? 'bg-amber-500' :
                  content.quality_grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                } text-white`}>
                  {content.quality_grade}
                </Badge>
              </div>
            )}
            
            {content?.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={content.url} target="_blank" rel="noopener noreferrer">
                  View Source
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            )}
            
            {content?.file_url && !content?.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={content.file_url} target="_blank" rel="noopener noreferrer">
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