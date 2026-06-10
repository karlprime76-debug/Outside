/**
 * Normalisation et utilitaires pour les hashtags OUTSIDE
 * Règles :
 * - max 10 hashtags par Moment ou Plan
 * - max 30 caractères par hashtag
 * - pas d'espace
 * - pas de caractères dangereux
 * - supprimer doublons
 * - lowercase pour la clé
 * - garder un displayName propre
 * - ignorer hashtags invalides
 * - ignorer hashtags bloqués
 * - ne pas casser les accents à l'affichage
 */

const MAX_HASHTAGS = 10;
const MAX_HASHTAG_LENGTH = 30;
const HASHTAG_REGEX = /#([a-zA-Z0-9À-ÿ_]+)/g;

/**
 * Extrait tous les hashtags d'un texte
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  
  const matches = text.match(HASHTAG_REGEX);
  if (!matches) return [];
  
  return matches.map(match => match.substring(1)); // Remove # prefix
}

/**
 * Normalise un hashtag pour la clé de base de données
 * Conserve les accents mais convertit en lowercase
 */
export function normalizeHashtag(tag: string): string {
  if (!tag) return '';
  
  // Remove # prefix if present
  const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
  
  // Convert to lowercase for the key
  const normalized = cleanTag.toLowerCase();
  
  // Remove dangerous characters (keep alphanumeric, accents, underscores)
  const sanitized = normalized.replace(/[^a-z0-9à-ÿ_]/g, '');
  
  return sanitized;
}

/**
 * Nettoie un hashtag en supprimant les caractères invalides
 */
export function sanitizeHashtag(tag: string): string {
  if (!tag) return '';
  
  const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
  
  // Remove dangerous characters but keep case for display
  const sanitized = cleanTag.replace(/[^a-zA-Z0-9À-ÿ_]/g, '');
  
  return sanitized;
}

/**
 * Retourne le hashtag formaté pour l'affichage avec #
 */
export function getDisplayHashtag(tag: string): string {
  const sanitized = sanitizeHashtag(tag);
  return sanitized ? `#${sanitized}` : '';
}

/**
 * Vérifie si un hashtag est valide
 */
export function isValidHashtag(tag: string): boolean {
  if (!tag) return false;
  
  const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
  
  // Check length
  if (cleanTag.length > MAX_HASHTAG_LENGTH || cleanTag.length < 1) {
    return false;
  }
  
  // Check for invalid characters
  const validChars = /^[a-zA-Z0-9À-ÿ_]+$/;
  if (!validChars.test(cleanTag)) {
    return false;
  }
  
  // Check for spaces
  if (cleanTag.includes(' ')) {
    return false;
  }
  
  return true;
}

/**
 * Limite le nombre de hashtags et supprime les doublons
 * Retourne les hashtags normalisés
 */
export function limitHashtags(tags: string[], max: number = MAX_HASHTAGS): string[] {
  if (!tags || tags.length === 0) return [];
  
  // Remove duplicates
  const uniqueTags = Array.from(new Set(tags.map(t => normalizeHashtag(t))));
  
  // Filter valid hashtags
  const validTags = uniqueTags.filter(tag => isValidHashtag(tag));
  
  // Limit to max
  return validTags.slice(0, max);
}

/**
 * Prépare les hashtags pour stockage
 * Extrait, normalise, valide et limite
 */
export function prepareHashtagsFromText(text: string): string[] {
  const extracted = extractHashtags(text);
  return limitHashtags(extracted);
}

/**
 * Formate les hashtags pour l'affichage dans une caption
 * Convertit les hashtags normaux en format #Hashtag
 */
export function formatHashtagsForCaption(tags: string[]): string {
  if (!tags || tags.length === 0) return '';
  
  return tags
    .map(tag => getDisplayHashtag(tag))
    .filter(tag => tag)
    .join(' ');
}

/**
 * Détecte si un texte contient trop de hashtags
 */
export function hasTooManyHashtags(text: string, max: number = MAX_HASHTAGS): boolean {
  const hashtags = extractHashtags(text);
  return hashtags.length > max;
}

/**
 * Extrait les hashtags d'un texte et retourne à la fois
 * les hashtags bruts et normalisés
 */
export function extractAndNormalizeHashtags(text: string): {
  raw: string[];
  normalized: string[];
} {
  const raw = extractHashtags(text);
  const normalized = raw.map(tag => normalizeHashtag(tag));
  
  return { raw, normalized };
}
