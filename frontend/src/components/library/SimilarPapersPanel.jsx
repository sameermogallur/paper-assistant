import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles } from "lucide-react";
import { useSimilarPapers } from '../../api/queries';

export default function SimilarPapersPanel({ paperId }) {
  const { data, isLoading, error } = useSimilarPapers(paperId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        Similar in your library
      </h3>

      {isLoading && (
        <div className="flex items-center text-slate-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Comparing embeddings…
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">Couldn't load similar papers: {error.message}</p>
      )}

      {data?.reason === 'no_embedding_for_paper' && (
        <p className="text-sm text-slate-500">
          No embedding is stored for this paper, so similarity can't be computed.
        </p>
      )}

      {data && !data.reason && data.results.length === 0 && (
        <p className="text-sm text-slate-500">
          No other papers with embeddings in your library yet.
        </p>
      )}

      {data?.results.length > 0 && (
        <ul className="space-y-3">
          {data.results.map((item) => (
            <li key={item.paper_id}>
              <Link
                to={`/papers/${item.paper_id}`}
                className="block group"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {item.title || 'Untitled paper'}
                    {item.year && <span className="text-slate-400 ml-1.5">({item.year})</span>}
                  </span>
                  <span className="text-xs font-medium text-slate-500 shrink-0">
                    {(item.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.max(0, Math.min(100, item.score * 100))}%` }}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
