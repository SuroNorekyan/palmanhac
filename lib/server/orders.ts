import { prisma } from "@/lib/server/db";

export const getOrdersForUser = async (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              priceCents: true,
              volumeMl: true,
            },
          },
        },
      },
      intent: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getOrderForUser = async (userId: string, orderId: string) => {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              priceCents: true,
              volumeMl: true,
            },
          },
        },
      },
      intent: true,
    },
  });
};
