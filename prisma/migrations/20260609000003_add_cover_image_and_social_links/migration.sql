-- 20260609000003_add_cover_image_and_social_links
-- Ajoute coverImage et socialLinks sur User pour le profil réseau social.
-- Additive uniquement — risque zéro.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialLinks" TEXT;
