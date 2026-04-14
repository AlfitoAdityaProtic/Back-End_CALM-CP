const prisma = require("../config/prisma");

const logActivity = async ({ userId = null, action, description = null }) => {
  try {
    if (!action) return;
    
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        description,
      },
    });
  } catch (error) {
    console.error("ACTIVITY LOG ERROR:", error.message);
  }
};

module.exports = logActivity;