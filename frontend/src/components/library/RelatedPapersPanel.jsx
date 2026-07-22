import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe, Loader2 } from "lucide-react";
import { useRelatedPapers } from '../../api/queries';

const REASON_MESSAGES = {
  paper_has_no_doi: "No DOI was detected for this paper, so OpenAlex can't be queried.",
  not_found_in_openalex: "This paper's DOI isn't indexed in OpenAlex.",
  no_related_works: "OpenAlex lists no related works for this paper.",
};

export default function RelatedPapersPanel({ paperId }) {
  const { data, isLoading, error, refetch, isRefetching } = useRelatedPapers(paperId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Globe className="w-4 h-4 text-cyan-600" />
        Related on OpenAlex
      </h3>

      {(isLoading || isRefetching) && (
        <div className="flex items-center text-slate-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Asking OpenAlex…
        </div>
      )}

      {error && !isRefetching && (
        <div className="text-sm text-slate-600">
          {error.status === 503 ? (
            <>
              <p className="mb-3">OpenAlex is unavailable right now.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </>
          ) : (
            <p>Couldn't load related papers: {error.message}</p>
          )}
        </div>
      )}

      {data?.reason && (
        <p className="text-sm text-slate-500">{REASON_MESSAGES[data.reason] || data.reason}</p>
      )}

      {data?.results.length > 0 && (
        <ul className="space-y-3">
          {data.results.map((item) => (
            <li key={item.openalex_id} className="text-sm">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-800 hover:text-indigo-600 transition-colors inline-flex items-start gap-1.5 group"
              >
                <span className="line-clamp-2">
                  {item.title}
                  {item.year && <span className="text-slate-400 ml-1.5">({item.year})</span>}
                </span>
                <ExternalLink className="w-3 h-3 mt-1 shrink-0 text-slate-300 group-hover:text-indigo-400" />
              </a>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.authors.join(', ')}
                {item.cited_by_count != null && (
                  <span className="ml-2 text-slate-400">· {item.cited_by_count.toLocaleString()} citations</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
