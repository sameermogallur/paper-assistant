import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  Brain, 
  Shield, 
  CheckCircle2,
  BarChart3,
  FileText
} from "lucide-react";
import CitationTable from './CitationTable';
import StatisticsPanel from './StatisticsPanel';
import BiasPanel from './BiasPanel';
import LogicPanel from './LogicPanel';
import TrustPanel from './TrustPanel';
import SummaryAccordion from './SummaryAccordion';

export default function NewsAnalysisTabs({ content }) {
  return (
    <Tabs defaultValue="bias" className="w-full">
      <TabsList className="w-full h-auto p-1.5 bg-slate-100 rounded-xl grid grid-cols-6 gap-1">
        <TabsTrigger 
          value="bias" 
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <Scale className="w-4 h-4" />
          <span className="hidden sm:inline">Bias</span>
        </TabsTrigger>
        <TabsTrigger 
          value="logic"
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline">Logic</span>
        </TabsTrigger>
        <TabsTrigger 
          value="trust"
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Trust</span>
        </TabsTrigger>
        <TabsTrigger 
          value="citations" 
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">Sources</span>
        </TabsTrigger>
        <TabsTrigger 
          value="statistics"
          className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Stats</span>
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
        <TabsContent value="bias" className="m-0">
          <BiasPanel biasAnalysis={content?.bias_analysis || {}} />
        </TabsContent>

        <TabsContent value="logic" className="m-0">
          <LogicPanel logicAnalysis={content?.logic_analysis || {}} />
        </TabsContent>

        <TabsContent value="trust" className="m-0">
          <TrustPanel trustAnalysis={content?.trust_analysis || {}} />
        </TabsContent>

        <TabsContent value="citations" className="m-0">
          <CitationTable citations={content?.citations || []} />
        </TabsContent>

        <TabsContent value="statistics" className="m-0">
          <StatisticsPanel 
            statistics={content?.statistics || []}
            redFlags={content?.red_flags || []}
            goodPractices={content?.good_practices || []}
          />
        </TabsContent>

        <TabsContent value="summary" className="m-0">
          <SummaryAccordion summary={content?.summary || {}} />
        </TabsContent>
      </div>
    </Tabs>
  );
}