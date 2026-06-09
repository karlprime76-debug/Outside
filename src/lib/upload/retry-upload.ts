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

function defaultShouldRetry(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Don't retry on permanent errors
  if (
    message.includes("format") ||
    message.includes("invalid") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("not found") ||
    message.includes("too large") ||
    message.includes("max size")
  ) {
    return false;
  }

  // Retry on network/temporary errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("fetch") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("econnrefused") ||
    message.includes("5") || // 5xx server errors
    message.includes("supabase") && (message.includes("timeout") || message.includes("network"))
  ) {
    return true;
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
