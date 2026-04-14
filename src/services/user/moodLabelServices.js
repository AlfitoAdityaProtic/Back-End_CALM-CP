const prisma = require("../../config/prisma");

const getActiveMoodLabels = async () => {
  return prisma.moodLabel.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      score: true,
      emoji: true,
      paperColor: true,
    },
  });
};

module.exports = {
  getActiveMoodLabels,
};
