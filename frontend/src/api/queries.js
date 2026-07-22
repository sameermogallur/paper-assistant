import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { airaApi } from './airaApi';

export const PAPERS_PAGE_SIZE = 24;

export function usePapersInfinite(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['papers', 'infinite', filters],
    queryFn: ({ pageParam }) =>
      airaApi.getPapers({ ...filters, limit: PAPERS_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.offset + lastPage.items.length;
      return loaded < lastPage.total ? loaded : undefined;
    },
  });
}

export function useAllPapers(filters = {}) {
  return useQuery({
    queryKey: ['papers', 'all', filters],
    queryFn: () => airaApi.getAllPapers(filters),
  });
}

export function usePaper(id) {
  return useQuery({
    queryKey: ['paper', id],
    queryFn: () => airaApi.getPaper(id),
    enabled: id != null,
  });
}

export function useSimilarPapers(id, opts = {}) {
  return useQuery({
    queryKey: ['paper', id, 'similar', opts],
    queryFn: () => airaApi.getSimilarPapers(id, opts),
    enabled: id != null,
  });
}

export function useRelatedPapers(id) {
  return useQuery({
    queryKey: ['paper', id, 'related'],
    queryFn: () => airaApi.getRelatedPapers(id),
    enabled: id != null,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => airaApi.getProjects(),
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => airaApi.getProject(id),
    enabled: id != null,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }) => airaApi.createProject(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useAddPaperToProject(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId) => airaApi.addPaperToProject(projectId, paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useRemovePaperFromProject(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paperId) => airaApi.removePaperFromProject(projectId, paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}
