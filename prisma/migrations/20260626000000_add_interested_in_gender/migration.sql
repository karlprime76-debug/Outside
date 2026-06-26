-- CreateEnum
CREATE TYPE "InterestedInGender" AS ENUM ('MEN', 'WOMEN', 'EVERYONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "interestedInGender" "InterestedInGender";
