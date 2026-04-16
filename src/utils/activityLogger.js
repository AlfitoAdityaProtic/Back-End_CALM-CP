const prisma = require("../config/prisma");

const logActivity = async ({
  userId = null,
  action,
  description = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    if (!action) {
      console.warn("ACTIVITY LOG SKIPPED: action is required");
      return null;
    }

    return await prisma.activityLog.create({
      data: {
        userId,
        action,
        description,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("ACTIVITY LOG ERROR FULL:", error);
    return null;
  }
};

module.exports = logActivity;
