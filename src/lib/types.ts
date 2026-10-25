export type ContentStatus = "draft" | "published";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface ProfileRow {
  id: string;
  slug: string;
  full_name: string;
  bio: string | null;
  details: string | null;
  photo_url: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogRow {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  content: string;
  cover_image_url: string | null;
  image_urls: string[] | null;
  author_id: string | null;
  category: string | null;
  status: ContentStatus;
  featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: ProfileRow | null;
}

export interface ThoughtRow {
  id: string;
  content: string;
  author_name: string;
  status: ContentStatus;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WinnerRow {
  id: string;
  full_name: string;
  photo_url: string | null;
  award_title: string;
  category: string | null;
  description: string | null;
  award_date: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubmissionRow {
  id: string;
  title: string;
  description: string | null;
  content: string;
  author_name: string;
  author_email: string;
  image_urls: string[] | null;
  status: SubmissionStatus;
  reviewed_at: string | null;
  created_at: string;
}

export const BLOG_AUTHOR_SELECT = "*, author:profiles(*)" as const;
