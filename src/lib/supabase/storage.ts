export const AVATARS_BUCKET = "avatars";
export const AVATAR_MAX_SIZE = 3 * 1024 * 1024;

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function getAvatarFileExtension(fileType: string): string {
  switch (fileType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

export function buildAvatarPath(userId: string, fileType: string): string {
  const ext = getAvatarFileExtension(fileType);
  const timestamp = Date.now();
  return `users/${userId}/avatar-${timestamp}.${ext}`;
}
