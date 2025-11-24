export enum PitchMode {
  COACH = 'COACH',
  ROLEPLAY = 'ROLEPLAY'
}

export enum DifficultyLevel {
  ROOKIE = 'ROOKIE',
  PRO = 'PRO',
  ELITE = 'ELITE'
}

export interface SessionConfig {
  mode: PitchMode;
  script?: string;
  difficulty: DifficultyLevel;
}

export type AudioVolumeCallback = (volume: number) => void;