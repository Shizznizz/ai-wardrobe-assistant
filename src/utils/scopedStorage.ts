/**
 * User-scoped localStorage helper.
 * Prevents cross-user data leakage on shared browsers by
 * prefixing keys with the authenticated user's ID.
 */

export function scopedKey(baseKey: string, userId?: string | null): string {
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export function getScopedItem(baseKey: string, userId?: string | null): string | null {
  return localStorage.getItem(scopedKey(baseKey, userId));
}

export function setScopedItem(baseKey: string, value: string, userId?: string | null): void {
  localStorage.setItem(scopedKey(baseKey, userId), value);
}

export function removeScopedItem(baseKey: string, userId?: string | null): void {
  localStorage.removeItem(scopedKey(baseKey, userId));
}
