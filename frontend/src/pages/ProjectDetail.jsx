import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen, Loader2, Plus, X } from "lucide-react";
import {
  useAddPaperToProject,
  useAllPapers,
  useProject,
  useRemovePaperFromProject,
} from '../api/queries';
import PaperCard from '../components/library/PaperCard';

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();

  const { data: project, isPending, error } = useProject(projectId);
  const membersQuery = useAllPapers({ projectId });
  const libraryQuery = useAllPapers();
  const addPaper = useAddPaperToProject(projectId);
  const removePaper = useRemovePaperFromProject(projectId);
  const [selectedId, setSelectedId] = useState('');

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading project…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md">
          <p className="text-lg font-medium text-slate-900 mb-2">Couldn't load this project</p>
          <p className="text-sm text-slate-600 mb-6">{error.message}</p>
          <Button variant="outline" onClick={() => navigate('/library')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const members = membersQuery.data?.items ?? [];
  const memberIds = new Set(members.map((p) => p.id));
  const addable = (libraryQuery.data?.items ?? []).filter((p) => !memberIds.has(p.id));
  // Until both lists resolve, the addable computation is unreliable — hold the picker
  const pickerReady = !membersQuery.isPending && !libraryQuery.isPending;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!selectedId) return;
    addPaper.mutate(Number(selectedId), { onSuccess: () => setSelectedId('') });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/library')}
          className="mb-4 -ml-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-indigo-600" />
            {project.name}
          </h1>
          {project.description && (
            <p className="text-slate-600 mb-2">{project.description}</p>
          )}
          <p className="text-sm text-slate-500 mb-8">
            {members.length} {members.length === 1 ? 'paper' : 'papers'}
          </p>
        </motion.div>

        {/* Add paper */}
        <form
          onSubmit={handleAdd}
          className="mb-8 bg-white rounded-xl border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="add-paper" className="text-sm font-medium text-slate-700">
              Add from library
            </label>
            <select
              id="add-paper"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={!pickerReady}
              className="flex-1 min-w-48 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">{pickerReady ? 'Select a paper…' : 'Loading papers…'}</option>
              {pickerReady && addable.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.title || `Untitled paper #${paper.id}`}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={!pickerReady || !selectedId || addPaper.isPending}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
            {pickerReady && addable.length === 0 && (
              <span className="text-sm text-slate-400">Every library paper is already in this project</span>
            )}
          </div>
          {addPaper.isError && (
            <p className="text-sm text-red-600 mt-2">Couldn't add paper: {addPaper.error.message}</p>
          )}
          {removePaper.isError && (
            <p className="text-sm text-red-600 mt-2">Couldn't remove paper: {removePaper.error.message}</p>
          )}
        </form>

        {/* Member papers */}
        {membersQuery.isPending ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading papers…
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-600">
            No papers in this project yet — add one from your library above.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                actions={
                  <button
                    onClick={() => removePaper.mutate(paper.id)}
                    disabled={removePaper.isPending}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Remove from project
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
