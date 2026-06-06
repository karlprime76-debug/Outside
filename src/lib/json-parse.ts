export function safeJsonParse<T = unknown>(
  jsonString: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (!jsonString) return fallback;

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("[safeJsonParse] Failed to parse JSON:", { jsonString, error });
    return fallback;
  }
}
