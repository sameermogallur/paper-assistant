
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Sparkles } from 'lucide-react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-slate-900"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            AIRA
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-slate-900 transition-colors"
            >
              Waitlist
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-slate-900">AIRA</span>
              <span className="text-slate-500 text-sm">• AI Research Assistant</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 AIRA. Your AI-powered research integrity co-pilot.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }
        * {
          font-family: var(--font-sans);
        }
      `}</style>
    </div>
  );
}
