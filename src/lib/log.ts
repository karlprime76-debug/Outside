export type LogTag =
  | "[AUTH_ERROR]"
  | "[PROFILE_ERROR]"
  | "[DM_ERROR]"
  | "[MOMENT_ERROR]"
  | "[PLAN_ERROR]"
  | "[LIVE_ERROR]"
  | "[NOTIFICATION_ERROR]"
  | "[SETTINGS_ERROR]"
  | "[PUSH_ERROR]"
  | "[ADMIN_PRO]"
  | "[ADMIN_PRO_ERROR]";

function safeSerialize(obj: unknown) {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof key === "string") {
        const k = key.toLowerCase();
        if (k.includes("password") || k.includes("token") || k.includes("secret") || k.includes("database_url")) {
          return "[REDACTED]";
        }
      }
      return value;
    });
  } catch {
    return String(obj);
  }
}

export function logError(tag: LogTag, message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.error(tag, message, safeSerialize(meta));
  } else {
    console.error(tag, message);
  }
}

export function logPerfStart(label: string) {
  if (process.env.NODE_ENV !== "production") console.time(label);
}

export function logPerfEnd(label: string) {
  if (process.env.NODE_ENV !== "production") console.timeEnd(label);
}
