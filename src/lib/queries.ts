import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BLOG_AUTHOR_SELECT,
  type BlogRow,
  type ProfileRow,
  type ThoughtRow,
  type WinnerRow,
} from "./types";

export const PAGE_SIZE = 9;

/** Removes characters that would break PostgREST or-filter syntax. */
function sanitizeTerm(q: string): string {
  return q.replace(/[(),;%"*\\]/g, " ").trim();
}

function blogTextFilter(q: string): string | null {
  const s = sanitizeTerm(q);
  if (!s) return null;
  return [
    `title.ilike.%${s}%`,
    `short_description.ilike.%${s}%`,
    `content.ilike.%${s}%`,
    `author.full_name.ilike.%${s}%`,
  ].join(",");
}

export interface BlogsPage {
  q?: string;
  category?: string;
}

export const publishedBlogsInfinite = ({ q, category }: BlogsPage) =>
  queryOptions({
    queryKey: ["blogs", "published", q ?? null, category ?? null],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      let query = supabase
        .from("blogs")
        .select(BLOG_AUTHOR_SELECT)
        .eq("status", "published");
      const filter = q ? blogTextFilter(q) : null;
      if (filter) query = query.or(filter);
      if (category) query = query.eq("category", category);
      const { data, error } = await query
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(pageParam * PAGE_SIZE, pageParam * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return data as unknown as BlogRow[];
    },
    initialPageParam: 0,
    getNextPageParam: (last: BlogRow[], all: BlogRow[][]) =>
      last.length === PAGE_SIZE ? all.length : undefined,
  });

export const blogCategories = queryOptions({
  queryKey: ["blogs", "categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("category")
      .eq("status", "published")
      .not("category", "is", null);
    if (error) throw error;
    return Array.from(new Set((data as { category: string }[]).map((r) => r.category))).sort();
  },
});

export const blogBySlug = (slug: string) =>
  queryOptions({
    queryKey: ["blogs", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(BLOG_AUTHOR_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`Article "${slug}" was not found`);
      return data as unknown as BlogRow;
    },
  });

export const latestBlogs = (limit: number) =>
  queryOptions({
    queryKey: ["blogs", "latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(BLOG_AUTHOR_SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as BlogRow[];
    },
  });

export const featuredBlogs = (limit: number) =>
  queryOptions({
    queryKey: ["blogs", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(BLOG_AUTHOR_SELECT)
        .eq("status", "published")
        .eq("featured", true)
        .order("sort_order", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data as unknown as BlogRow[];
    },
  });

export const relatedBlogs = (blogId: string, category: string | null) =>
  queryOptions({
    queryKey: ["blogs", "related", blogId, category],
    queryFn: async () => {
      let query = supabase
        .from("blogs")
        .select(BLOG_AUTHOR_SELECT)
        .eq("status", "published")
        .neq("id", blogId)
        .limit(3);
      if (category) query = query.eq("category", category);
      const { data, error } = await query
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      if (category && data.length === 0) {
        // fall back to recent articles from any category
        const { data: fallback, error: fallbackError } = await supabase
          .from("blogs")
          .select(BLOG_AUTHOR_SELECT)
          .eq("status", "published")
          .neq("id", blogId)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(3);
        if (fallbackError) throw fallbackError;
        return fallback as unknown as BlogRow[];
      }
      return data as unknown as BlogRow[];
    },
  });

export const activeProfiles = (limit: number) =>
  queryOptions({
    queryKey: ["profiles", "active", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as ProfileRow[];
    },
  });

export const profileById = (id: string) =>
  queryOptions({
    queryKey: ["profiles", "id", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Profile not found");
      return data as unknown as ProfileRow;
    },
  });

export const profileBlogs = (authorId: string) =>
  queryOptions({
    queryKey: ["blogs", "author", authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select(BLOG_AUTHOR_SELECT)
        .eq("status", "published")
        .eq("author_id", authorId)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as unknown as BlogRow[];
    },
  });

export const publishedThoughts = (limit: number) =>
  queryOptions({
    queryKey: ["thoughts", "published", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thoughts")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as ThoughtRow[];
    },
  });

export const activeWinners = (limit: number) =>
  queryOptions({
    queryKey: ["winners", "active", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winners")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as WinnerRow[];
    },
  });
