import React from 'react';
import type { Recommendation } from '@/types';

type Difficulty = Recommendation['implementationDifficulty'];

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

const DIFFICULTY_CLASS_MAP: Record<Difficulty, string> = {
  easy: 'bg-sky-100/80 text-sky-800 ring-1 ring-sky-200',
  medium: 'bg-indigo-100/90 text-indigo-800 ring-1 ring-indigo-200',
  hard: 'bg-rose-100/85 text-rose-800 ring-1 ring-rose-200',
};

const DIFFICULTY_LABEL_MAP: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Complex',
};

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${DIFFICULTY_CLASS_MAP[difficulty]}`}
    >
      {DIFFICULTY_LABEL_MAP[difficulty]}
    </span>
  );
};
