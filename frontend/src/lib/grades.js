// Single source of truth for the grade → color scheme. Every badge/gauge
// must pull from here; per-component copies drifted before this existed.
export const GRADE_COLORS = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' },
  B: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50' },
  C: { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50' },
  D: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' },
  F: { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50' },
};

export function gradeBadgeClass(grade) {
  return (GRADE_COLORS[grade] || GRADE_COLORS.F).bg;
}
