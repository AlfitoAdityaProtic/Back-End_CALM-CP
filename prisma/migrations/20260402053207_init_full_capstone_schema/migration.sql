-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('local', 'google');

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT,
    "username" TEXT,
    "phone_number" TEXT,
    "profile_photo_url" TEXT,
    "auth_provider" "AuthProvider" NOT NULL DEFAULT 'local',
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "google_email" TEXT NOT NULL,
    "google_sub" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "google_account_id" TEXT,
    "google_event_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "attendee_count" INTEGER DEFAULT 0,
    "event_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battery_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "min_score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battery_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_battery_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "battery_status_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "total_duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "social_intensity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "battery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculation_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_battery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_labels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "score" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mood_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mood_label_id" TEXT NOT NULL,
    "feeling_text" TEXT NOT NULL,
    "mood_score" INTEGER,
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encouragement_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mood_entry_id" TEXT NOT NULL,
    "predicted_label" TEXT,
    "support_message" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "model_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encouragement_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_accounts_user_id_key" ON "google_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_accounts_google_sub_key" ON "google_accounts"("google_sub");

-- CreateIndex
CREATE INDEX "google_accounts_user_id_idx" ON "google_accounts"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_google_account_id_idx" ON "calendar_events"("google_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_user_id_google_event_id_key" ON "calendar_events"("user_id", "google_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "battery_statuses_name_key" ON "battery_statuses"("name");

-- CreateIndex
CREATE INDEX "social_battery_logs_user_id_idx" ON "social_battery_logs"("user_id");

-- CreateIndex
CREATE INDEX "social_battery_logs_battery_status_id_idx" ON "social_battery_logs"("battery_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_battery_logs_user_id_date_key" ON "social_battery_logs"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "mood_labels_name_key" ON "mood_labels"("name");

-- CreateIndex
CREATE INDEX "mood_entries_user_id_idx" ON "mood_entries"("user_id");

-- CreateIndex
CREATE INDEX "mood_entries_mood_label_id_idx" ON "mood_entries"("mood_label_id");

-- CreateIndex
CREATE INDEX "encouragement_results_user_id_idx" ON "encouragement_results"("user_id");

-- CreateIndex
CREATE INDEX "encouragement_results_mood_entry_id_idx" ON "encouragement_results"("mood_entry_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_accounts" ADD CONSTRAINT "google_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_google_account_id_fkey" FOREIGN KEY ("google_account_id") REFERENCES "google_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_battery_logs" ADD CONSTRAINT "social_battery_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_battery_logs" ADD CONSTRAINT "social_battery_logs_battery_status_id_fkey" FOREIGN KEY ("battery_status_id") REFERENCES "battery_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_mood_label_id_fkey" FOREIGN KEY ("mood_label_id") REFERENCES "mood_labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encouragement_results" ADD CONSTRAINT "encouragement_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encouragement_results" ADD CONSTRAINT "encouragement_results_mood_entry_id_fkey" FOREIGN KEY ("mood_entry_id") REFERENCES "mood_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
