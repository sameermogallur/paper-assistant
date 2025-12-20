import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  BarChart3, 
  Award, 
  FileText 
} from "lucide-react";
import CitationTable from './CitationTable';
import StatisticsPanel from './StatisticsPanel';
import QualityGauge from './QualityGauge';
import SummaryAccordion from './SummaryAccordion';

export default function AnalysisTabs({ paper }) {
  return (
    <Tabs defaultValue="citations" className="w-full">
      <TabsList className="w-full h-auto p-1.5 bg-slate-100 rounded-xl grid grid-cols-4 gap-1">
        <TabsTrigger 
          value="citations" 
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">Citations</span>
        </TabsTrigger>
        <TabsTrigger 
          value="statistics"
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Statistics</span>
        </TabsTrigger>
        <TabsTrigger 
          value="quality"
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <Award className="w-4 h-4" />
          <span className="hidden sm:inline">Quality</span>
        </TabsTrigger>
        <TabsTrigger 
          value="summary"
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Summary</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="citations" className="m-0">
          <CitationTable citations={paper?.citations || []} />
        </TabsContent>

        <TabsContent value="statistics" className="m-0">
          <StatisticsPanel 
            statistics={paper?.statistics || []}
            redFlags={paper?.red_flags || []}
            goodPractices={paper?.good_practices || []}
          />
        </TabsContent>

        <TabsContent value="quality" className="m-0">
          <QualityGauge 
            score={paper?.quality_score || 0}
            grade={paper?.quality_grade || 'C'}
            breakdown={paper?.score_breakdown || []}
          />
        </TabsContent>

        <TabsContent value="summary" className="m-0">
          <SummaryAccordion summary={paper?.summary || {}} />
        </TabsContent>
      </div>
    </Tabs>
  );
}