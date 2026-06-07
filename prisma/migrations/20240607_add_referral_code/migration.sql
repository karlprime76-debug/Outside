-- Add referralCode column to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Add unique constraint on referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key"
ON "User"("referralCode");

-- Create MomentScore table if it doesn't exist
CREATE TABLE IF NOT EXISTS "MomentScore" (
    id TEXT NOT NULL PRIMARY KEY,
    momentId TEXT NOT NULL UNIQUE,
    score REAL NOT NULL DEFAULT 0,
    viralScore REAL NOT NULL DEFAULT 0,
    localScore REAL NOT NULL DEFAULT 0,
    qualityScore REAL NOT NULL DEFAULT 0,
    safetyScore REAL NOT NULL DEFAULT 1,
    impressions INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    completions INTEGER NOT NULL DEFAULT 0,
    replays INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0,
    dmShares INTEGER NOT NULL DEFAULT 0,
    saves INTEGER NOT NULL DEFAULT 0,
    reports INTEGER NOT NULL DEFAULT 0,
    profileOpens INTEGER NOT NULL DEFAULT 0,
    followsGenerated INTEGER NOT NULL DEFAULT 0,
    notInterested INTEGER NOT NULL DEFAULT 0,
    seeMoreLikeThis INTEGER NOT NULL DEFAULT 0,
    avgWatchMs INTEGER NOT NULL DEFAULT 0,
    replayRate REAL NOT NULL DEFAULT 0,
    quickSkipRate REAL NOT NULL DEFAULT 0,
    audienceLevel INTEGER NOT NULL DEFAULT 0,
    lastCalculatedAt TIMESTAMP,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for MomentScore
CREATE INDEX IF NOT EXISTS "MomentScore_score_idx" ON "MomentScore"("score");
CREATE INDEX IF NOT EXISTS "MomentScore_viralScore_idx" ON "MomentScore"("viralScore");
CREATE INDEX IF NOT EXISTS "MomentScore_localScore_idx" ON "MomentScore"("localScore");
CREATE INDEX IF NOT EXISTS "MomentScore_updatedAt_idx" ON "MomentScore"("updatedAt");

-- Create UserQualityScore table if it doesn't exist
CREATE TABLE IF NOT EXISTS "UserQualityScore" (
    id TEXT NOT NULL PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    score REAL NOT NULL DEFAULT 50,
    trust REAL NOT NULL DEFAULT 0,
    activity REAL NOT NULL DEFAULT 0,
    reportsPenalty REAL NOT NULL DEFAULT 0,
    creatorBoost REAL NOT NULL DEFAULT 0,
    lastCalculatedAt TIMESTAMP,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
