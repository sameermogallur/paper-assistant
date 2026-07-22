import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Library as LibraryIcon, Loader2, Plus } from "lucide-react";
import { usePapersInfinite, useProjects, useCreateProject } from '../api/queries';
import PaperCard from '../components/library/PaperCard';

export default function Library() {
  const {
    data,
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePapersInfinite();
  const { data: projects } = useProjects();
  const createProject = useCreateProject();
  const [newProjectName, setNewProjectName] = useState('');

  const papers = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const handleCreateProject = (e) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    createProject.mutate({ name }, { onSuccess: () => setNewProjectName('') });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <LibraryIcon className="w-7 h-7 text-indigo-600" />
            Library
          </h1>
          <p className="text-slate-600 mb-8">
            Every analyzed paper in your local library, with stored integrity reports.
          </p>
        </motion.div>

        {/* Projects strip */}
        <div className="mb-8 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mr-2">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              Projects
            </span>
            {(projects ?? []).map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer">
                  {project.name}
                  <span className="ml-1.5 text-slate-400">{project.paper_count}</span>
                </Badge>
              </Link>
            ))}
            {projects?.length === 0 && (
              <span className="text-sm text-slate-400">None yet</span>
            )}
            <form onSubmit={handleCreateProject} className="flex items-center gap-2 ml-auto">
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name"
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm" disabled={createProject.isPending || !newProjectName.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </form>
          </div>
          {createProject.isError && (
            <p className="text-sm text-red-600 mt-2 text-right">
              Couldn't create project: {createProject.error.message}
            </p>
          )}
        </div>

        {/* Papers grid */}
        {isPending && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading your library…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            Couldn't load the library: {error.message}
          </div>
        )}

        {!isPending && !error && papers.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-lg font-medium text-slate-900 mb-2">Your library is empty</p>
            <p className="text-slate-600 mb-6">
              Analyze a paper and it will be saved here automatically.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Analyze a paper</Link>
            </Button>
          </div>
        )}

        {papers.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {papers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Load more ({papers.length} of {total})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
