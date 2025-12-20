import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Beaker, 
  BarChart3, 
  MessageSquare,
  Lightbulb
} from "lucide-react";

const sectionIcons = {
  abstract: FileText,
  methods: Beaker,
  results: BarChart3,
  discussion: MessageSquare
};

const sectionColors = {
  abstract: 'indigo',
  methods: 'cyan',
  results: 'emerald',
  discussion: 'violet'
};

export default function SummaryAccordion({ summary = {} }) {
  const sections = [
    { key: 'abstract', label: 'Abstract' },
    { key: 'methods', label: 'Methods' },
    { key: 'results', label: 'Results' },
    { key: 'discussion', label: 'Discussion' }
  ].filter(s => summary[s.key]);

  const keyFindings = summary.key_findings || [];

  return (
    <div className="space-y-8">
      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Key Findings</h3>
          </div>
          <ul className="space-y-3">
            {keyFindings.map((finding, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </span>
                <p className="text-slate-700">{finding}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Summaries */}
      {sections.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-3">
          {sections.map((section, index) => {
            const Icon = sectionIcons[section.key] || FileText;
            const color = sectionColors[section.key] || 'slate';
            
            return (
              <AccordionItem
                key={section.key}
                value={section.key}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white px-0"
              >
                <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${color}-100`}>
                      <Icon className={`w-4 h-4 text-${color}-600`} />
                    </div>
                    <span className="font-medium text-slate-900">{section.label}</span>
                    <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                      AI Summary
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-slate max-w-none"
                  >
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {summary[section.key]}
                    </p>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="p-12 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No AI summary available for this paper</p>
        </div>
      )}
    </div>
  );
}