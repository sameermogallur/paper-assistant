import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "@/components/landing/HeroSection";
import FeatureGrid from "@/components/landing/FeatureGrid";
import WaitlistSection from "@/components/landing/WaitlistSection";
import InputSelector from "@/components/upload/InputSelector";
import FileUploader from "@/components/upload/FileUploader";
import UrlInput from "@/components/upload/UrlInput";
import ContentTypeSelector from "@/components/upload/ContentTypeSelector";
import AnalysisProgress from "@/components/shared/AnalysisProgress";
import ContentHeader from "@/components/dashboard/ContentHeader";
import AnalysisTabs from "@/components/dashboard/AnalysisTabs";
import NewsAnalysisTabs from "@/components/dashboard/NewsAnalysisTabs";
import { airaApi } from '../api/airaApi';

function generateScoreBreakdown(result) {
  const breakdown = [];

  const signals = result.integrity_signals || [];
  
  // Citations Verified
  const citationScore = result.references_found > 0 
    ? Math.round((result.references_verified / result.references_found) * 20) 
    : 0;
  breakdown.push({
    criterion: 'Citations Verified',
    score: citationScore,
    maxScore: 20,
    status: citationScore >= 16 ? 'pass' : citationScore >= 10 ? 'partial' : 'fail'
  });
  
  // Statistical Reporting
  const hasStats = result.statistics && result.statistics.p_values && result.statistics.p_values.length > 0;
  const statScore = hasStats ? 12 : 5;
  breakdown.push({
    criterion: 'Statistical Reporting',
    score: statScore,
    maxScore: 15,
    status: hasStats ? 'pass' : 'partial'
  });
  
  // Limitations Section
  const hasLimitations = !signals.some(s => s.toLowerCase().includes('no limitations'));
  breakdown.push({
    criterion: 'Limitations Discussed',
    score: hasLimitations ? 10 : 0,
    maxScore: 10,
    status: hasLimitations ? 'pass' : 'fail'
  });
  
  // Ethics Statement
  const hasEthics = !signals.some(s => s.toLowerCase().includes('no ethics'));
  breakdown.push({
    criterion: 'Ethics Statement',
    score: hasEthics ? 10 : 0,
    maxScore: 10,
    status: hasEthics ? 'pass' : 'fail'
  });
  
  // Conflict of Interest
  const hasCOI = !signals.some(s => s.toLowerCase().includes('conflict of interest'));
  breakdown.push({
    criterion: 'Conflict of Interest Disclosed',
    score: hasCOI ? 10 : 0,
    maxScore: 10,
    status: hasCOI ? 'pass' : 'fail'
  });
  
  // Pre-registration (bonus)
  const hasPreReg = signals.some(s => s.toLowerCase().includes('pre-registered'));
  breakdown.push({
    criterion: 'Pre-registration',
    score: hasPreReg ? 10 : 0,
    maxScore: 10,
    status: hasPreReg ? 'pass' : 'partial'
  });
  
  // Open Data (bonus)
  const hasOpenData = signals.some(s => s.toLowerCase().includes('open data') || s.toLowerCase().includes('data/code'));
  breakdown.push({
    criterion: 'Open Data/Code',
    score: hasOpenData ? 10 : 0,
    maxScore: 10,
    status: hasOpenData ? 'pass' : 'partial'
  });
  
  // Replication
  const hasReplication = signals.some(s => s.toLowerCase().includes('replication'));
  breakdown.push({
    criterion: 'Replication Discussed',
    score: hasReplication ? 5 : 0,
    maxScore: 5,
    status: hasReplication ? 'pass' : 'partial'
  });
  
  return breakdown;
}

export default function Home() {
  const [view, setView] = useState('landing');
  const [inputType, setInputType] = useState('pdf');
  const [contentType, setContentType] = useState(null);
  const [content, setContent] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const uploadRef = useRef(null);

  const scrollToUpload = () => {
    setView('upload');
    setInputType('pdf');
    setContentType(null);
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFileUploaded = async (file, fileUrl) => {
    setPendingFile({ file, fileUrl });
  };

  const handleContentTypeSelected = async (type) => {
    setContentType(type);
    if (pendingFile && type === 'research') {
      setView('analyzing');
      try {
        const analysisResult = await airaApi.analyzePdf(pendingFile.file);
        
        // Handle OCR-needed case
        if (analysisResult.extraction_method === 'failed_needs_ocr') {
          alert('This PDF appears to be scanned. OCR is not enabled in the hosted demo. Please try a text-based PDF.');
          setView('upload');
          setPendingFile(null);
          return;
        }
        
        const content = {
          title: pendingFile.file.name.replace('.pdf', ''),
          source_type: 'research',
          input_type: 'pdf',
          status: 'analyzed',
          page_count: analysisResult.pages,
          word_count: analysisResult.word_count,
          sections_detected: analysisResult.sections_detected,
          quality_score: analysisResult.integrity_score,
          quality_grade: analysisResult.integrity_grade,
          citations: analysisResult.citations.map(c => ({
            text: c.raw_text,
            title: c.title || c.normalized,
            authors: c.authors ? c.authors.join(', ') : '',
            doi: c.doi || '',
            verified: c.status === 'verified',
            confidence: c.confidence
          })),
          statistics: [
            ...analysisResult.statistics.p_values.map(p => ({
              type: 'p-value',
              value: p,
              context: p.includes('0.05') || p.includes('0.04') ? 'Near significance threshold' : null,
              flag: (p.includes('0.05') || p.includes('0.04') || p.includes('0.06')) ? 'Borderline significance' : null
            })),
            ...analysisResult.statistics.sample_sizes.map(n => ({
              type: 'sample_size',
              value: n,
              context: null,
              flag: parseInt(n.match(/\d+/)?.[0] || '0') < 30 ? 'Small sample' : null
            })),
            ...analysisResult.statistics.effect_sizes.map(e => ({
              type: 'effect_size',
              value: e,
              context: null,
              flag: null
            })),
            ...analysisResult.statistics.cis.map(ci => ({
              type: 'confidence_interval',
              value: ci,
              context: null,
              flag: null
            }))
          ],
          red_flags: analysisResult.statistics.red_flags.filter(f => !f.startsWith('✅')),
          good_practices: analysisResult.statistics.red_flags.filter(f => f.startsWith('✅')),
          score_breakdown: generateScoreBreakdown(analysisResult),
          summary: {
            key_findings: [
              analysisResult.references_verified + ' of ' + analysisResult.references_found + ' citations verified',
              analysisResult.statistics.p_values.length + ' p-values extracted',
              analysisResult.intext_total + ' in-text citations found'
            ]
          },
          _raw: analysisResult
        };
        
        setContent(content);
        setPendingFile(null);
      } catch (error) {
        console.error('Analysis failed:', error);
        alert('Analysis failed: ' + error.message);
        setView('upload');
      }
    } else if (type === 'news') {
      alert('News analysis coming soon! Please select Research Paper for now.');
    }
  };

  const handleUrlSubmitted = async (url, type, domain) => {
    setView('analyzing');
    const mockContent = await analyzeContent(
      extractTitleFromUrl(url),
      type,
      'url',
      url,
      null,
      domain
    );
    setContent(mockContent);
  };

  const extractTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const slug = path.split('/').filter(Boolean).pop() || 'Article';
      return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    } catch {
      return 'Untitled Article';
    }
  };

  const analyzeContent = async (title, sourceType, inputType, url, fileUrl, domain) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseContent = {
          title,
          source_type: sourceType,
          input_type: inputType,
          url: url || null,
          file_url: fileUrl || null,
          domain: domain || null,
          status: 'analyzed',
          page_count: inputType === 'pdf' ? Math.floor(Math.random() * 30) + 5 : null,
          word_count: Math.floor(Math.random() * 5000) + 1000,
          quality_score: Math.floor(Math.random() * 30) + 65,
          quality_grade: ['A', 'B', 'B', 'C'][Math.floor(Math.random() * 4)],
          citations: generateMockCitations(sourceType),
          statistics: generateMockStatistics(),
          red_flags: sourceType === 'news' 
            ? ['Emotionally charged language detected', 'Single-source reporting']
            : ['Multiple p-values clustered near 0.05', 'No limitations section detected'],
          good_practices: sourceType === 'news'
            ? ['Multiple perspectives included', 'Expert sources cited']
            : ['Ethics approval mentioned', 'Sample size calculation provided', 'Open data statement included'],
          summary: generateMockSummary(sourceType),
        };

        if (sourceType === 'research') {
          baseContent.sections_detected = ['Abstract', 'Introduction', 'Methods', 'Results', 'Discussion', 'References'];
          baseContent.score_breakdown = [
            { criterion: 'Citations Verified', score: 18, maxScore: 20, status: 'pass' },
            { criterion: 'Statistical Reporting', score: 12, maxScore: 15, status: 'partial' },
            { criterion: 'Methodology Clarity', score: 15, maxScore: 15, status: 'pass' },
            { criterion: 'Limitations Section', score: 5, maxScore: 10, status: 'partial' },
            { criterion: 'Ethics Statement', score: 10, maxScore: 10, status: 'pass' },
            { criterion: 'Conflict of Interest', score: 8, maxScore: 10, status: 'pass' },
            { criterion: 'Reproducibility', score: 12, maxScore: 20, status: 'partial' }
          ];
        } else {
          // News-specific analysis
          baseContent.bias_analysis = generateMockBiasAnalysis();
          baseContent.logic_analysis = generateMockLogicAnalysis();
          baseContent.trust_analysis = generateMockTrustAnalysis(domain);
        }

        resolve(baseContent);
      }, 0);
    });
  };

  const generateMockCitations = (sourceType) => {
    if (sourceType === 'news') {
      return [
        { text: 'CDC Report, 2024', title: 'Centers for Disease Control Official Report', authors: 'CDC', doi: '', verified: true, confidence: 0.95 },
        { text: 'Dr. Jane Smith, Harvard', title: 'Expert Interview', authors: 'Smith, J.', doi: '', verified: true, confidence: 0.85 },
        { text: 'Reuters', title: 'Wire Service Report', authors: 'Reuters Staff', doi: '', verified: true, confidence: 0.90 },
        { text: 'Anonymous Source', title: 'Unattributed Claim', authors: '', doi: '', verified: false, confidence: 0.30 },
        { text: 'Industry Study', title: 'Unnamed Industry Publication', authors: '', doi: '', verified: false, confidence: 0.45 }
      ];
    }
    return [
      { text: 'Smith et al., 2020', title: 'Understanding Research Methodology in Social Sciences', authors: 'Smith, J., Johnson, K., Williams, R.', doi: '10.1000/xyz123', verified: true, confidence: 0.95 },
      { text: 'Johnson & Williams, 2019', title: 'Statistical Methods for Educational Research', authors: 'Johnson, K., Williams, R.', doi: '10.1000/abc456', verified: true, confidence: 0.88 },
      { text: 'Brown, 2021', title: 'Meta-Analysis in Clinical Trials', authors: 'Brown, M.', doi: '10.1000/def789', verified: true, confidence: 0.92 },
      { text: 'Davis et al., 2018', title: 'Qualitative Research Design Principles', authors: 'Davis, L., Thompson, S., Clark, E.', doi: '', verified: false, confidence: 0.45 },
      { text: 'Wilson, 2022', title: 'Emerging Trends in Data Science', authors: 'Wilson, P.', doi: '10.1000/ghi012', verified: true, confidence: 0.97 }
    ];
  };

  const generateMockStatistics = () => {
    return [
      { type: 'p-value', value: 'p < 0.001', context: 'Main effect of treatment on outcome variable', flag: null },
      { type: 'p-value', value: 'p = 0.048', context: 'Interaction effect in subgroup analysis', flag: 'Near significance threshold' },
      { type: 'sample_size', value: 'N = 245', context: 'Total participants enrolled in the study', flag: null },
      { type: 'effect_size', value: "Cohen's d = 0.67", context: 'Effect size for primary outcome', flag: null },
      { type: 'confidence_interval', value: '95% CI [0.42, 0.91]', context: 'Confidence interval for main effect', flag: null }
    ];
  };

  const generateMockSummary = (sourceType) => {
    if (sourceType === 'news') {
      return {
        key_findings: [
          'New policy announced affecting healthcare coverage',
          'Experts divided on potential economic impact',
          'Implementation expected within 6 months'
        ]
      };
    }
    return {
      abstract: 'This study investigates the relationship between research methodology and publication success.',
      methods: 'The study employed a stratified random sampling approach with multivariate regression analysis.',
      results: 'Key findings indicate a significant positive correlation (r=0.67, p<0.001) between methodological rigor and citation counts.',
      discussion: 'Results support the hypothesis that methodological quality influences research impact.',
      key_findings: [
        'Methodological rigor correlates with higher citation counts',
        'Transparent reporting improves peer review outcomes',
        'Pre-registration associated with 40% higher acceptance rates'
      ]
    };
  };

  const generateMockBiasAnalysis = () => {
    const politicalScore = Math.floor(Math.random() * 60) - 30;
    const generalScore = Math.floor(Math.random() * 50) + 15;
    
    const getPoliticalLabel = (score) => {
      if (score < -50) return 'Far Left';
      if (score < -20) return 'Left-Leaning';
      if (score < 20) return 'Center';
      if (score < 50) return 'Right-Leaning';
      return 'Far Right';
    };

    const getGeneralLabel = (score) => {
      if (score < 20) return 'Neutral';
      if (score < 40) return 'Slightly Biased';
      if (score < 60) return 'Moderately Biased';
      if (score < 80) return 'Heavily Biased';
      return 'Extremely Biased';
    };

    return {
      political_score: politicalScore,
      political_label: getPoliticalLabel(politicalScore),
      general_score: generalScore,
      general_label: getGeneralLabel(generalScore),
      indicators: [
        { type: 'Loaded Language', description: 'Use of emotionally charged words to influence reader perception', excerpt: 'devastating policy failure', severity: 'medium' },
        { type: 'Selective Framing', description: 'Presenting facts in a way that supports a particular narrative', excerpt: 'critics argue... while supporters claim...', severity: 'low' },
        { type: 'Attribution Bias', description: 'Asymmetric treatment of different groups or perspectives', severity: 'low' }
      ]
    };
  };

  const generateMockLogicAnalysis = () => {
    return {
      score: Math.floor(Math.random() * 30) + 60,
      fallacy_count: 3,
      fallacies: [
        { 
          name: 'Appeal to Authority', 
          description: 'Using an authority figure\'s opinion as evidence without proper verification of their expertise in the specific matter.',
          excerpt: 'According to the famous celebrity, this treatment is effective...',
          severity: 'medium'
        },
        { 
          name: 'False Dichotomy', 
          description: 'Presenting only two options when more alternatives exist.',
          excerpt: 'We must either accept this policy or face economic collapse.',
          severity: 'high'
        },
        { 
          name: 'Hasty Generalization', 
          description: 'Drawing broad conclusions from limited examples.',
          excerpt: 'Three local businesses closed, proving the economy is in freefall.',
          severity: 'medium'
        }
      ]
    };
  };

  const generateMockTrustAnalysis = (domain) => {
    const knownReliable = ['nytimes.com', 'reuters.com', 'apnews.com', 'bbc.com', 'npr.org'];
    const isReliable = domain && knownReliable.some(d => domain.includes(d));
    
    return {
      score: isReliable ? Math.floor(Math.random() * 15) + 80 : Math.floor(Math.random() * 30) + 50,
      grade: isReliable ? 'A' : ['B', 'C'][Math.floor(Math.random() * 2)],
      source_reputation: isReliable ? 'Highly Established' : 'Established',
      claims_verified: 4,
      claims_unverified: 2,
      claims_disputed: 1,
      fact_checks: [
        {
          claim: 'The new policy will affect 50 million Americans',
          verdict: 'Verified',
          source: 'Congressional Budget Office',
          explanation: 'CBO estimates confirm this figure based on current enrollment data and projected changes.'
        },
        {
          claim: 'Costs will increase by 200% within two years',
          verdict: 'Disputed',
          source: 'FactCheck.org',
          explanation: 'Multiple analyses suggest increases between 15-40%, with 200% being an extreme outlier estimate.'
        },
        {
          claim: 'Similar policies have failed in other countries',
          verdict: 'Unverified',
          source: 'Unable to verify',
          explanation: 'Insufficient context provided to assess. Results vary significantly by country and implementation.'
        }
      ]
    };
  };

  const handleAnalysisComplete = () => {
    setView('dashboard');
  };

  const handleBackToUpload = () => {
    setView('upload');
    setContent(null);
    setContentType(null);
    setPendingFile(null);
  };

  const isNews = content?.source_type === 'news';

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HeroSection onGetStarted={scrollToUpload} />
            <FeatureGrid />
            <WaitlistSection />
          </motion.div>
        )}

        {view === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={uploadRef}
            className="min-h-screen flex items-center justify-center py-20 px-6"
          >
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Analyze Content
                </h2>
                <p className="text-slate-600">
                  Upload a PDF or paste a URL to analyze research papers or news articles.
                </p>
              </div>

              {/* Input Type Selector */}
              <InputSelector inputType={inputType} onSelect={setInputType} />

              {/* PDF Upload Flow */}
              {inputType === 'pdf' && !pendingFile && (
                <FileUploader onFileUploaded={handleFileUploaded} />
              )}

              {/* Content Type Selection for PDF */}
              {inputType === 'pdf' && pendingFile && !contentType && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{pendingFile.file.name}</p>
                      <p className="text-sm text-slate-500">Ready for analysis</p>
                    </div>
                  </div>
                  <ContentTypeSelector
                    contentType={contentType}
                    onSelect={handleContentTypeSelected}
                    suggestedType="research"
                  />
                </motion.div>
              )}

              {/* URL Input Flow */}
              {inputType === 'url' && (
                <UrlInput onUrlSubmitted={handleUrlSubmitted} />
              )}
            </div>
          </motion.div>
        )}

        {view === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center py-20 px-6"
          >
            <div className="w-full max-w-lg text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">
                Analyzing Your {content?.source_type === 'news' || contentType === 'news' ? 'Article' : 'Paper'}
              </h2>
              <AnalysisProgress onComplete={handleAnalysisComplete} />
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && content && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ContentHeader content={content} onBack={handleBackToUpload} />
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(content, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${content.title || 'analysis'}-report.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </button>
            </div>
            <div className="max-w-6xl mx-auto px-6 py-8">
              {isNews ? (
                <NewsAnalysisTabs content={content} />
              ) : (
                <AnalysisTabs paper={content} />
              )}
            </div>
            
            {/* Waitlist CTA */}
            <div className="max-w-6xl mx-auto px-6 pb-16">
              <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-center">
                <h3 className="text-2xl font-bold mb-2">Want more features?</h3>
                <p className="text-indigo-100 mb-4">
                  Join our waitlist for browser plugins, conversational AI, and real-time fact-checking.
                </p>
                <a 
                  href="#"
                  onClick={(e) => { e.preventDefault(); setView('landing'); }}
                  className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Join Waitlist
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}