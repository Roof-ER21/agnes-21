export enum PitchMode {
  COACH = 'COACH',
  ROLEPLAY = 'ROLEPLAY'
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  ROOKIE = 'ROOKIE',
  PRO = 'PRO',
  ELITE = 'ELITE',
  NIGHTMARE = 'NIGHTMARE'
}

export interface SessionConfig {
  mode: PitchMode;
  script?: string;
  difficulty: DifficultyLevel;
}

export type AudioVolumeCallback = (volume: number) => void;