/**
 * Resolves a stored image reference into a renderable URL.
 * Admin-managed imagery lives in the private `letter-images` bucket and is
 * served same-origin through /api/media. Submission attachments (private) are
 * previewed by admins through short-lived signed URLs instead.
 */
export function mediaUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (/^https?:\/\//i.test(stored)) return stored;
  const path = stored.replace(/^\/+/, "").replace(/^letter-images\//, "");
  if (!path) return null;
  return `/api/media/letter-images/${path}`;
}

export const SITE_NAME = "The Letter";
export const CONTACT_EMAIL = "theletter.fas@gmail.com";
