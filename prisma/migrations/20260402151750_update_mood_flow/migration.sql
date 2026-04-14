/*
  Warnings:

  - A unique constraint covering the columns `[mood_entry_id]` on the table `encouragement_results` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('pending', 'success', 'failed');

-- AlterTable
ALTER TABLE "mood_entries" ADD COLUMN     "analysis_error" TEXT,
ADD COLUMN     "analysis_status" "AnalysisStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "encouragement_results_mood_entry_id_key" ON "encouragement_results"("mood_entry_id");
