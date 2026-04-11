import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getVerificationRank(score: number) {
  if (score >= 95) return { rank: 'S', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Superb Mastery (S)' };
  if (score >= 80) return { rank: 'A', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Excellent Performance (A)' };
  if (score >= 65) return { rank: 'B', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Good Competency (B)' };
  if (score >= 50) return { rank: 'C', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/20', label: 'Average Skill (C)' };
  if (score >= 35) return { rank: 'D', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Poor Result (D)' };
  if (score >= 15) return { rank: 'E', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'Weak Performance (E)' };
  return { rank: 'F', color: 'text-red-600', bg: 'bg-red-600/10', border: 'border-red-600/20', label: 'Failure (F)' };
}
