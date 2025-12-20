import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Loader2, Globe, CheckCircle } from "lucide-react";
import ContentTypeSelector from './ContentTypeSelector';

// Known domains for type detection
const NEWS_DOMAINS = [
  'nytimes.com', 'washingtonpost.com', 'cnn.com', 'bbc.com', 'bbc.co.uk',
  'theguardian.com', 'reuters.com', 'apnews.com', 'foxnews.com', 'nbcnews.com',
  'cbsnews.com', 'abcnews.go.com', 'usatoday.com', 'wsj.com', 'bloomberg.com',
  'politico.com', 'thehill.com', 'axios.com', 'vox.com', 'huffpost.com',
  'buzzfeednews.com', 'vice.com', 'slate.com', 'theatlantic.com', 'newyorker.com',
  'npr.org', 'pbs.org', 'time.com', 'newsweek.com', 'forbes.com'
];

const RESEARCH_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'nature.com', 'science.org',
  'sciencedirect.com', 'springer.com', 'wiley.com', 'tandfonline.com',
  'jstor.org', 'researchgate.net', 'academia.edu', 'arxiv.org', 'biorxiv.org',
  'medrxiv.org', 'ssrn.com', 'plos.org', 'frontiersin.org', 'mdpi.com',
  'cell.com', 'thelancet.com', 'bmj.com', 'jamanetwork.com', 'nejm.org'
];

export default function UrlInput({ onUrlSubmitted }) {
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState(null);
  const [suggestedType, setSuggestedType] = useState(null);
  const [domainWarning, setDomainWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const extractDomain = (urlString) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  const detectContentType = (domain) => {
    if (!domain) return null;
    
    if (NEWS_DOMAINS.some(d => domain.includes(d))) {
      return 'news';
    }
    if (RESEARCH_DOMAINS.some(d => domain.includes(d))) {
      return 'research';
    }
    return null;
  };

  useEffect(() => {
    const domain = extractDomain(url);
    setIsValid(!!domain);
    
    if (domain) {
      const detected = detectContentType(domain);
      setSuggestedType(detected);
      setDomainWarning(null);
    } else {
      setSuggestedType(null);
      setDomainWarning(null);
    }
  }, [url]);

  useEffect(() => {
    if (contentType && suggestedType && contentType !== suggestedType) {
      const domain = extractDomain(url);
      if (suggestedType === 'news') {
        setDomainWarning(`This appears to be a news site (${domain}). Are you sure it's a research paper?`);
      } else if (suggestedType === 'research') {
        setDomainWarning(`This appears to be a research database (${domain}). Are you sure it's news?`);
      }
    } else {
      setDomainWarning(null);
    }
  }, [contentType, suggestedType, url]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !contentType) return;
    
    setLoading(true);
    const domain = extractDomain(url);
    
    // Simulate fetching - in production this would fetch the actual content
    setTimeout(() => {
      onUrlSubmitted(url, contentType, domain);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div className="relative">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-12 h-14 text-lg bg-slate-50 border-slate-200"
            />
            {isValid && (
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            )}
          </div>

          {/* Domain Display */}
          {isValid && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <Globe className="w-4 h-4" />
              <span>Source: {extractDomain(url)}</span>
            </motion.div>
          )}

          {/* Content Type Selector */}
          {isValid && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ContentTypeSelector
                contentType={contentType}
                onSelect={setContentType}
                suggestedType={suggestedType}
                domainWarning={domainWarning}
              />
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || !contentType || loading}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Fetching Content...
              </>
            ) : (
              'Start Analysis'
            )}
          </Button>
        </form>
      </motion.div>

      <p className="text-center text-sm text-slate-500">
        Paste any news article or research paper URL for instant analysis
      </p>
    </div>
  );
}