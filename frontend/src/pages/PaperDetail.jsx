import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileWarning, Loader2 } from "lucide-react";
import { usePaper } from '../api/queries';
import { buildAnalysisContent } from '../lib/reportTransform';
import ContentHeader from '../components/dashboard/ContentHeader';
import AnalysisTabs from '../components/dashboard/AnalysisTabs';
import SimilarPapersPanel from '../components/library/SimilarPapersPanel';
import RelatedPapersPanel from '../components/library/RelatedPapersPanel';

export default function PaperDetail() {
  const { id } = useParams();
  const paperId = Number(id);
  const navigate = useNavigate();
  // isPending (not isLoading): a paused query (e.g. offline) keeps status
  // 'pending' with isLoading false — dereferencing data then would crash.
  const { data: paper, isPending, error } = usePaper(paperId);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading paper…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md">
          <p className="text-lg font-medium text-slate-900 mb-2">Couldn't load this paper</p>
          <p className="text-sm text-slate-600 mb-6">{error.message}</p>
          <Button variant="outline" onClick={() => navigate('/library')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const content = paper.report
    ? buildAnalysisContent(paper.report, {
        title: paper.title || 'Untitled paper',
        created_date: paper.created_at,
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {content ? (
        <>
          <ContentHeader
            content={content}
            onBack={() => navigate('/library')}
            backLabel="Back to Library"
          />
          <div className="max-w-6xl mx-auto px-6 py-8">
            <AnalysisTabs paper={content} />
          </div>
        </>
      ) : (
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Button
            variant="ghost"
            onClick={() => navigate('/library')}
            className="mb-4 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <div className="bg-white rounded-2xl border border-slate-200 p-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {paper.title || 'Untitled paper'}
            </h1>
            <p className="flex items-center gap-2 text-slate-600">
              <FileWarning className="w-4 h-4 text-amber-500" />
              No stored analysis for this paper.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-6">
        <SimilarPapersPanel paperId={paperId} />
        <RelatedPapersPanel paperId={paperId} />
      </div>
    </div>
  );
}
