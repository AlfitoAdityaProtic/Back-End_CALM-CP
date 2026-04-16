const prisma = require("../../config/prisma");

const allowedSortFields = ["createdAt", "action"];

const buildActivityLogWhere = (query) => {
  const { search = "", action, userId, startDate, endDate } = query;

  const where = {};

  if (search) {
    where.OR = [
      {
        action: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        user: {
          is: {
            OR: [
              {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                username: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ];
  }

  if (action) {
    where.action = action;
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt.gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  return where;
};

const buildActivityLogOrderBy = (query) => {
  const { sortBy = "createdAt", order = "desc" } = query;

  const safeOrder = order === "asc" ? "asc" : "desc";

  if (!allowedSortFields.includes(sortBy)) {
    return { createdAt: safeOrder };
  }

  return { [sortBy]: safeOrder };
};

const baseInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      role: true,
    },
  },
};

const getActivityLogs = async (query) => {
  let { page = 1, limit = 10 } = query;

  page = Number(page) || 1;
  limit = Number(limit) || 10;

  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  const where = buildActivityLogWhere(query);
  const orderBy = buildActivityLogOrderBy(query);

  const [logs, totalItems] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: baseInclude,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      totalItems,
      // totalPages: Math.ceil(totalItems / limit),
      totalPages: totalItems > 0 ? Math.ceil(totalItems / limit) : 0,
    },
  };
};

const getActivityLogsForExport = async (query) => {
  const where = buildActivityLogWhere(query);
  const orderBy = buildActivityLogOrderBy(query);

  return prisma.activityLog.findMany({
    where,
    orderBy,
    include: baseInclude,
  });
};

module.exports = {
  getActivityLogs,
  getActivityLogsForExport,
  buildActivityLogWhere,
  buildActivityLogOrderBy,
};
