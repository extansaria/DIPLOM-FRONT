export type PageId = "home" | "catalog" | "blog" | "workout";

export interface Exercise {
  id: string;
  slug?: string;
  name: string;
  muscleGroup: string;
  muscleGroupLabel?: string;
  description: string;
  cardDescription?: string;
  detailedDescription?: string;
  technique: string;
  techniqueSteps?: string[];
  mistakes: string;
  equipment: string;
  videoUrl?: string;
  posterUrl?: string;
}

export interface Profile {
  id: string | null;
  nickname: string | null;
  name: string;
  email: string;
  authenticated: boolean;
}

export interface SearchSuggestionItem {
  slug?: string;
  id?: string;
  title: string;
  muscleGroup?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
}

export interface Review {
  id: string;
  author: string;
  text: string;
  /** Оценка от 1 до 5 */
  rating?: number;
}

export type WorkoutsByDay = Record<string, Exercise[]>;

export interface AiProgramQuestionnaire {
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  trainingPlace: "gym" | "home";
  goal: string;
  level: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  limitations?: string;
}

export interface AiMatch {
  id: string;
  slug: string;
  title: string;
  bodyPartSlug?: string;
  bodyPart?: string;
  muscleGroupSlug?: string;
  muscleGroup?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  matches?: AiMatch[];
}

export interface BodyPart {
  id: string;
  name: string;
}

export interface MuscleGroupRow {
  id: string;
  name: string;
}
