export type PageId = "home" | "catalog" | "blog" | "reviews" | "workout";

export interface Exercise {
  id: string;
  slug?: string;
  name: string;
  muscleGroup: string;
  muscleGroupLabel?: string;
  description: string;
  technique: string;
  mistakes: string;
  equipment: string;
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
}

export type WorkoutsByDay = Record<string, Exercise[]>;

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
