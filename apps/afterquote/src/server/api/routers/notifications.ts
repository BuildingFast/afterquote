/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type User } from "@prisma/client";
import { NotificationPurpose } from "@prisma/client";

export const notificationsRouter = createTRPCRouter({
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user: User | null = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (current_user && current_user.organizationId) {
        const notifications = await ctx.prisma.notification.findMany({
          where: {
            userId: current_user.id,
            organizationId: current_user.organizationId,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            rfq: true,
            salesOrder: true,
          },
        });

        const filteredNotifications = notifications.filter((notification) => {
          if (notification.rfq && notification.rfq.deleted) {
            return false;
          }
          if (notification.salesOrder && notification.salesOrder.deleted) {
            return false;
          }
          return true;
        });

        return filteredNotifications;
      } else {
        console.log("Could not get organization id");
      }
    } catch (error) {
      console.log("Error getting notifications", error);
    }
  }),

  createNotificationForCustomerPortalSalesOrderClick: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const current_customer = await ctx.prisma.salesOrder.findUnique({
          where: {
            id: input.salesOrderId,
          },
          select: {
            customer: {
              select: {
                companyName: true,
              },
            },
            organizationId: true,
          },
        });
        if (!current_customer || !current_customer.organizationId) {
          return;
        }
        const notificationsOrg = await ctx.prisma.organization.findFirst({
          where: {
            id: current_customer.organizationId,
          },
          select: {
            users: true,
          },
        });
        const notifications_to_create = notificationsOrg?.users.map((usr) => {
          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            message:
              "Customer viewed order on customer portal " +
              (current_customer?.customer.companyName
                ? "- " + current_customer?.customer.companyName
                : ""),
            purpose: NotificationPurpose.CustomerPortalViewed,
            userId: usr.id,
            organizationId: current_customer.organizationId ?? "",
            salesOrderId: input.salesOrderId,
          };
        });
        await ctx.prisma.notification.createMany({
          data: notifications_to_create ?? [],
        });
      } catch (error) {
        console.log("Error creating notifications", error);
      }
    }),
  createNotificationForCustomerPortalFileClick: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const current_customer = await ctx.prisma.salesOrder.findUnique({
          where: {
            id: input.salesOrderId,
          },
          select: {
            customer: {
              select: {
                companyName: true,
              },
            },
            organizationId: true,
          },
        });
        if (!current_customer || !current_customer.organizationId) {
          return;
        }
        const notificationsOrg = await ctx.prisma.organization.findFirst({
          where: {
            id: current_customer.organizationId,
          },
          select: {
            users: true,
          },
        });
        const notifications_to_create = notificationsOrg?.users.map((usr) => {
          return {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            message:
              "Customer " +
              (current_customer?.customer.companyName
                ? current_customer?.customer.companyName
                : "") +
              " viewed file " +
              input.fileName +
              " on customer portal ",
            purpose: NotificationPurpose.CustomerPortalFileViewed,
            userId: usr.id,
            organizationId: current_customer.organizationId ?? "",
            salesOrderId: input.salesOrderId,
          };
        });
        await ctx.prisma.notification.createMany({
          data: notifications_to_create ?? [],
        });
      } catch (error) {
        console.log("Error creating notifications", error);
      }
    }),
  createNotificationForChat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        notificationFor: z.string(),
        rfqId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const current_user: User | null = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        const current_customer = await ctx.prisma.rfq.findUnique({
          where: {
            id: input.rfqId,
          },
          select: {
            customer: {
              select: {
                companyName: true,
              },
            },
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.notification.create({
            data: {
              userId: input.notificationFor,
              message:
                input.message +
                (current_customer?.customer.companyName
                  ? " - " + current_customer?.customer.companyName
                  : ""),
              purpose: "ChatMention",
              organizationId: current_user.organizationId,
              rfqId: input.rfqId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Error creating notification for rfq chat", error);
      }
    }),
  createNotificationForSalesOrderChat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        notificationFor: z.string(),
        salesOrderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const current_user: User | null = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        const current_customer = await ctx.prisma.salesOrder.findUnique({
          where: {
            id: input.salesOrderId,
          },
          select: {
            customer: {
              select: {
                companyName: true,
              },
            },
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.notification.create({
            data: {
              userId: input.notificationFor,
              message:
                input.message +
                (current_customer?.customer.companyName
                  ? " - " + current_customer?.customer.companyName
                  : ""),
              purpose: "ChatMention",
              organizationId: current_user.organizationId,
              salesOrderId: input.salesOrderId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Error creating notification for rfq chat", error);
      }
    }),
  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user: User | null = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.notification.updateMany({
            where: {
              userId: current_user.id,
              id: input.notificationId,
            },
            data: {
              read: true,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Error marking notification as read", error);
      }
    }),
  markNotificationAsUnRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user: User | null = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.notification.updateMany({
            where: {
              userId: current_user.id,
              id: input.notificationId,
            },
            data: {
              read: false,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Error marking notification as read", error);
      }
    }),
  markAllNotificationsAsRead: protectedProcedure.mutation(
    async ({ ctx, input }) => {
      try {
        const current_user: User | null = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.notification.updateMany({
            where: {
              userId: current_user.id,
            },
            data: {
              read: true,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Error marking notification as read", error);
      }
    }
  ),
  getUnreadNotificationsCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user: User | null = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (current_user && current_user.organizationId) {
        const unreadCount = await ctx.prisma.notification.count({
          where: {
            userId: current_user.id,
            organizationId: current_user.organizationId,
            read: false,
            OR: [
              {
                rfq: {
                  deleted: { equals: null },
                },
              },
              {
                salesOrder: {
                  deleted: { equals: null },
                },
              },
              {
                purpose: {
                  in: [NotificationPurpose.InviteAccepted],
                },
              },
            ],
          },
        });

        return unreadCount;
      } else {
        console.log("Could not get organization id");
      }
    } catch (error) {
      console.log("Error getting unread notification count", error);
    }
  }),
});
