import React from 'react';
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  BarChart3, 
  Award, 
  Brain,
  AlertTriangle,
  BookOpen
} from "lucide-react";

const features = [
  {
    icon: CheckCircle2,
    title: "Citation Verification",
    description: "Every reference verified against Crossref database with DOI matching and confidence scoring.",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: BarChart3,
    title: "Statistical Extraction",
    description: "Automatically pulls p-values, sample sizes, effect sizes, and confidence intervals.",
    color: "blue",
    gradient: "from-blue-500 to-indigo-500"
  },
  {
    icon: Award,
    title: "Quality Score",
    description: "Heuristic trustworthiness score (0-100) with detailed grade breakdown.",
    color: "violet",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: AlertTriangle,
    title: "Bias Detection",
    description: "Linguistic analysis identifies political leaning and general bias levels in news content.",
    color: "amber",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    icon: Brain,
    title: "Logic Analysis",
    description: "Detects logical fallacies like false dichotomies, hasty generalizations, and appeals to authority.",
    color: "pink",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: BookOpen,
    title: "Trust & Fact-Checking",
    description: "Verifies claims against reliable sources and assesses source reputation.",
    color: "cyan",
    gradient: "from-cyan-500 to-blue-500"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function FeatureGrid() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-indigo-600 font-medium text-sm tracking-wide uppercase"
          >
            Comprehensive Analysis
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 text-4xl md:text-5xl font-bold text-slate-900"
          >
            Everything you need to verify research
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto"
          >
            Upload once, get comprehensive insights in seconds
          </motion.p>
        </div>

        {/* Feature Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative p-8 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-6`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Gradient Line */}
              <div className={`absolute bottom-0 left-8 right-8 h-1 rounded-full bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}