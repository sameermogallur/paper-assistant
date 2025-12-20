import React, { useState } from 'react';
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search,
  ExternalLink 
} from "lucide-react";

export default function CitationTable({ citations = [] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCitations = citations.filter(citation =>
    citation.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    citation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    citation.authors?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (citation) => {
    if (citation.verified) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
    if (citation.confidence > 0.5) {
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusBadge = (citation) => {
    if (citation.verified) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0">
          Verified
        </Badge>
      );
    }
    if (citation.confidence > 0.5) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0">
          Partial Match
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 border-0">
        Unverified
      </Badge>
    );
  };

  const verifiedCount = citations.filter(c => c.verified).length;
  const partialCount = citations.filter(c => !c.verified && c.confidence > 0.5).length;
  const unverifiedCount = citations.filter(c => !c.verified && c.confidence <= 0.5).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Verified</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{verifiedCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Partial</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{partialCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Unverified</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{unverifiedCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search citations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-white border-slate-200"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Citation</TableHead>
              <TableHead>DOI</TableHead>
              <TableHead className="w-24">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  No citations found
                </TableCell>
              </TableRow>
            ) : (
              filteredCitations.map((citation, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <TableCell>{getStatusIcon(citation)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 line-clamp-1">
                        {citation.title || citation.text}
                      </p>
                      {citation.authors && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          {citation.authors}
                        </p>
                      )}
                      {getStatusBadge(citation)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {citation.doi ? (
                      <a
                        href={`https://doi.org/${citation.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        {citation.doi}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            citation.confidence >= 0.8 ? 'bg-emerald-500' :
                            citation.confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(citation.confidence || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">
                        {Math.round((citation.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}