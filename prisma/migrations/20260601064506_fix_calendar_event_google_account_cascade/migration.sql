/*
  Warnings:

  - A unique constraint covering the columns `[google_account_id,google_event_id]` on the table `calendar_events` will be added. If there are existing duplicate values, this will fail.
  - Made the column `google_account_id` on table `calendar_events` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_google_account_id_fkey";

-- DropIndex
DROP INDEX "calendar_events_user_id_google_event_id_key";

-- AlterTable
ALTER TABLE "calendar_events" ALTER COLUMN "google_account_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_google_account_id_google_event_id_key" ON "calendar_events"("google_account_id", "google_event_id");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_google_account_id_fkey" FOREIGN KEY ("google_account_id") REFERENCES "google_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
