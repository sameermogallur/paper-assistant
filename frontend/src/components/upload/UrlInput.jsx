import React from 'react';

export default function UrlInput({ onUrlSubmitted }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
      <div className="inline-block px-3 py-1 bg-slate-200 text-slate-600 text-sm font-medium rounded-full mb-3">
        Coming Soon
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">URL Analysis</h3>
      <p className="text-slate-500">
        Analyze web articles and news content. This feature is coming in a future update.
      </p>
    </div>
  );
}
