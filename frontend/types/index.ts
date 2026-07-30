/**
 * Core Data Models & Types
 * 
 * This file contains the TypeScript definitions for the application's core entities.
 * Centralizing types ensures consistency across components, API requests, and responses.
 * 
 * @module types
 */

export interface User {
  id: number;
  username: string;
  email: string;
  is_active?: boolean;
  image_path?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at?: string;
  author: User; // Expanded from author_id when joined
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string | { loc: string[]; msg: string; type: string }[];
}
