-- AlterTable
ALTER TABLE "social_battery_logs" ADD COLUMN     "ai_insight" TEXT,
ADD COLUMN     "ai_model_name" TEXT,
ADD COLUMN     "ai_score_explanation" TEXT,
ADD COLUMN     "recovery_suggestion" TEXT;
