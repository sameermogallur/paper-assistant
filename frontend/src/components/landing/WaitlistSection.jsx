import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export default function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    console.log('Waitlist signup:', email);
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Decorative Elements */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-60" />
          
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100/80 text-indigo-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </span>
          
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Want early access to the full platform?
          </h2>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Be the first to access conversational research assistance, literature review tools, 
            and data cleaning features.
          </p>

          {/* Signup Form */}
          {!submitted ? (
            <motion.form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 px-6 text-lg bg-white border-slate-200 shadow-sm"
                required
              />
              <Button 
                type="submit"
                disabled={loading}
                size="lg"
                className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 whitespace-nowrap"
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700"
            >
              <Check className="w-5 h-5" />
              <span className="font-medium">You're on the list! We'll be in touch soon.</span>
            </motion.div>
          )}

          {/* Future Features Preview */}
          <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left">
            {[
              { title: "Conversational AI", desc: "Ask AIRA to clean data, find papers, or proofread" },
              { title: "Literature Hub", desc: "Auto-generate synthesis matrices across papers" },
              { title: "Pre-Submit Check", desc: "Full methodology and formatting verification" }
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl bg-white border border-slate-100 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}