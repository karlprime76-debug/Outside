-- 20260624000001_add_spotify
-- Adds SPOTIFY source type and spotifyTrackId for Spotify track integration

ALTER TYPE "AudioSourceType" ADD VALUE IF NOT EXISTS 'SPOTIFY';
ALTER TABLE "AudioTrack" ADD COLUMN IF NOT EXISTS "spotifyTrackId" TEXT;
CREATE INDEX IF NOT EXISTS "AudioTrack_spotifyTrackId_idx" ON "AudioTrack"("spotifyTrackId");
