# 🧠 CALM – Back-End API

Back-end API for **CALM (Care And Life Mode)** — a mental health platform that helps users track their mood and social energy levels.

Built with **Express.js**, **Prisma ORM**, **PostgreSQL (Supabase)**, and **Google OAuth** integration.

---

## 🛠️ Tech Stack

| Technology                   | Purpose                |
| ---------------------------- | ---------------------- |
| Node.js + Express.js         | HTTP server & routing  |
| Prisma ORM                   | Database querying      |
| PostgreSQL (via Supabase)    | Primary data storage   |
| Supabase Storage             | Profile photo storage  |
| JWT (Access + Refresh Token) | User authentication    |
| Google OAuth 2.0             | Sign in with Google    |
| Nodemailer (Gmail SMTP)      | Email delivery         |
| Fonnte                       | WhatsApp notifications |

---

## ✅ Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) (LTS version — check with `node -v`)
- [npm](https://www.npmjs.com/) (comes with Node.js — check with `npm -v`)
- [Supabase](https://supabase.com/) account (free) — used instead of a local PostgreSQL instance

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AlfitoAdityaProtic/Back-End_CALM-CP.git
cd Back-End_CALM-CP
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open the `.env` file and fill in all required values. See the [Environment Variables Guide](#️-environment-variables-guide) below.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Seed initial data

This will insert: user roles,admin roles, mood labels, and social battery statuses.

```bash
npm run seed
```

### 7. Start the development server

```bash
npm run dev
```

Server will be running at: **http://localhost:5000**

---

## ⚙️ Environment Variables Guide

Copy `.env.example` to `.env`, then fill in each section below:

### 🗄️ Database (Supabase)

```env
# Get this from: Supabase Dashboard → Project Settings → Database → Connection String → Mode: Transaction
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 🌐 Server

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 📦 Supabase Storage

```env
# Get these from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROFILE_BUCKET=profile-photos
```

### 🔐 JWT

```env
JWT_ACCESS_SECRET=create_a_long_random_secret_string
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 🔑 Google OAuth

```env
# Get these from: console.cloud.google.com → Credentials → OAuth 2.0 Client IDs
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_LOGIN_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
GOOGLE_CALENDAR_SCOPE=https://www.googleapis.com/auth/calendar.readonly
```

### 📧 Email (Gmail SMTP)

```env
# Use a Gmail App Password, NOT your regular account password
# Generate one at: myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=youremail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM="Calm App <youremail@gmail.com>"

EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 💬 Fonnte (WhatsApp)

```env
# Get this from: https://md.fonnte.com/new/login.php → Device → Token
FONNTE_TOKEN=your_fonnte_token
FONNTE_URL=https://api.fonnte.com/send
```

### 🤖 AI Services

```env
SOCIAL_BATTERY_AI_URL=your_social_battery_ai_url
MOOD_ANALYSIS_AI_URL=your_mood_analysis_ai_url
```

---

## 🔍 Optional Commands

### View your database visually (Prisma Studio)

```bash
npx prisma studio
```

Then open `http://localhost:5555` in your browser.

### Run as production server

```bash
npm start
```

### Reset the database (wipes all data)

> ⚠️ **Warning:** This will permanently delete all data.

```bash
npx prisma migrate reset
npx prisma generate
npm run seed
```

---

## 📡 URLs

| Environment | URL                     |
| ----------- | ----------------------- |
| Local       | `http://localhost:5000` |

---

## 🐛 Troubleshooting

| Error                         | Solution                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `Can't reach database server` | Check `DATABASE_URL` in `.env` — make sure the format and password are correct |
| `Port 5000 already in use`    | Change `PORT` in `.env` to another number (e.g. `5001`)                        |
| `Invalid prisma.* invocation` | Re-run `npx prisma generate`                                                   |
| Error during `migrate dev`    | Make sure your Supabase connection is active and `DATABASE_URL` is valid       |

---

## 👥 Team

Part of the **CALM Capstone Project** — Coding Camp 2026 powered by DBS Foundation.
**Team ID:** CC26-PSU122
