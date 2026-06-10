import { customAlphabet } from "nanoid";

// Unambiguous, URL-safe, lowercase alphabet (no 0/o/1/l/i collisions on print).
const nanoid = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 7);

export function generateSlug(): string {
  return nanoid();
}
