require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@capstone.com",
    },
    update: {
      passwordHash: hashedPassword,
      username: "admin",
      authProvider: "local",
      role: "admin",
      isEmailVerified: true,
    },
    create: {
      email: "admin@capstone.com",
      passwordHash: hashedPassword,
      fullName: "Super Admin",
      username: "admin",
      authProvider: "local",
      role: "admin",
      isEmailVerified: true,
    },
  });
  await prisma.moodLabel.createMany({
    data: [
      {
        name: "baik",
        description: "Mood positif atau menyenangkan",
        score: 3,
      },
      {
        name: "biasa saja",
        description: "Mood netral",
        score: 2,
      },
      {
        name: "buruk",
        description: "Mood negatif atau kurang baik",
        score: 1,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.batteryStatus.createMany({
    data: [
      {
        name: "high",
        description: "Social battery tinggi",
        minScore: 80,
        maxScore: 100,
        color: "green",
      },
      {
        name: "medium",
        description: "Social battery sedang",
        minScore: 50,
        maxScore: 79,
        color: "yellow",
      },
      {
        name: "low",
        description: "Social battery rendah",
        minScore: 0,
        maxScore: 49,
        color: "red",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
