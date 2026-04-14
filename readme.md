# Capstone Project - API Backend

Back-end API for Capstone Project built with **Express.js**, **Prisma**, and **PostgreSQL**.

## Tech Stack
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Prerequisites
Make sure these are installed on your laptop:
- Node.js
- npm
- PostgreSQL

## Getting Started

### 1. Go to API folder
```bash
cd api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment File
```bash 
cp .env.example .env
```
### 3.1. Edit .env:
```env
DATABASE_URL="your_postgresql_connection_url"
JWT_SECRET="your_jwt_secret"
PORT=5000
```

### 4. Create Database
create a PostgreSQL database that matches your DATABASE_URL
```bash
capstone_db
```

### 5. Run Migration
```bash
npx prisma migrate dev
```

### 6. Generate Prisma Client 
```bash
npx prisma generate
```

### 7. Seed Initial Data
this will insert :
- user admin roles
- mood labels
- battery statuses

```bash
npm run seed
```
### 8. open Prisma Studio (Optional)
```bash
npx prisma studio
```

### 9. Run Development Server
```bash
npm run dev
```
API will run at :
```bash
http://localhost:5000
```

### 10. Run Production Server (Optional)
```bash
npm start
```

# Optional Decision
### 1. Reset Database:
```bash
npx prisma migrate reset
```
After reset, run :
```bash
npx prisma generate
npm run seed
```