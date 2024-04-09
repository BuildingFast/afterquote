/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const orderItemsRouter = createTRPCRouter({
  createOrderLineItem: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        partName: z.string(),
        partNumber: z.nullable(z.string()),
        partQuantity: z.number(),
        partCost: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.create({
            data: {
              partName: input.partName,
              partNumber: input.partNumber,
              partQuantity: input.partQuantity,
              partCost: input.partCost,
              userId: ctx.session.user.id,
              salesOrderId: input.salesOrderId,
              organizationId: currentUser.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to create order line item", error);
      }
    }),
  updateOrderLineItemName: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partName: input.partName,
              userId: ctx.session.user.id,
              organizationId: currentUser.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update order line item", error);
      }
    }),
  updateOrderLineItemDetails: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partDetails: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partDetails: input.partDetails,
              userId: ctx.session.user.id,
              organizationId: currentUser.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update order line item", error);
      }
    }),
  updateOrderLineItemCost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partCost: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partCost: input.partCost,
              userId: ctx.session.user.id,
              organizationId: currentUser.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update order line item", error);
      }
    }),
  updateOrderLineItemQuantity: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partQuantity: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partQuantity: input.partQuantity,
              userId: ctx.session.user.id,
              organizationId: currentUser.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update order line item", error);
      }
    }),
  getOrderLineItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.findFirst({
            where: {
              organizationId: currentUser.organizationId,
              id: input.id,
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getOrderLineItems: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.findMany({
            where: {
              organizationId: currentUser.organizationId,
              salesOrderId: input.id,
            },
            orderBy: {
              createdAt: "asc",
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  deleteOrderLineItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.orderLineItem.delete({
            where: {
              id: input,
              organizationId: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
});
