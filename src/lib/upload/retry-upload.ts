export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  onRetry?: (_attempt: number, _error: Error) => void;
  shouldRetry?: (_error: Error) => boolean;
}

export interface UploadProgress {
  status: "preparing" | "compressing" | "uploading" | "processing" | "completed" | "error";
  percentage: number;
  message?: string;
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    onRetry,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if error is not retryable
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);

      onRetry?.(attempt, lastError);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

const PERMANENT_PATTERNS = [
  // English
  "format", "invalid", "unauthorized", "forbidden", "not found",
  "too large", "max size",
  // French
  "non autorisé", "accès refusé", "format non accepté",
  "fichier trop lourd", "introuvable", "trop volumineux",
];

const RETRYABLE_PATTERNS = [
  // English
  "network", "timeout", "fetch", "econnreset", "etimedout", "econnrefused",
  // French
  "réseau", "connexion", "délai",
];

function defaultShouldRetry(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Check for HTTP status codes in the error
  const statusMatch = message.match(/\b(\d{3})\b/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10);
    // 4xx client errors - don't retry
    if (status >= 400 && status < 500) return false;
    // 5xx server errors - retry
    if (status >= 500) return true;
  }

  // Don't retry on permanent errors
  for (const pattern of PERMANENT_PATTERNS) {
    if (message.includes(pattern)) return false;
  }

  // Retry on network/temporary errors
  for (const pattern of RETRYABLE_PATTERNS) {
    if (message.includes(pattern)) return true;
  }

  // Default to retry for unknown errors (up to max attempts)
  return true;
}

export async function uploadWithRetry<T>(
  _file: File,
  uploadFn: (file: File, _progress?: (_progress: UploadProgress) => void) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryAsync(() => uploadFn(_file), options);
}
