/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const quoteRouter = createTRPCRouter({
  createQuoteLineItem: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
        partName: z.string(),
        partNumber: z.nullable(z.string()),
        partQuantity: z.number(),
        partCost: z.number(),
        processId: z.nullable(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          const createdQuoteLineItem = await ctx.prisma.quoteLineItem.create({
            data: {
              partName: input.partName,
              partNumber: input.partNumber,
              partQuantity: input.partQuantity,
              partCost: input.partCost,
              userId: ctx.session.user.id,
              rfqId: input.rfqId,
              organizationId: current_user.organizationId,
              processId: input.processId,
            },
          });
          if (!input.processId) {
            return createdQuoteLineItem;
          }
          const process = await ctx.prisma.processesCatalog.findFirst({
            select: {
              processMachines: true,
              processMaterials: true,
            },
            where: {
              id: input.processId,
            },
          });
          if (!process) {
            return createdQuoteLineItem;
          }
          // Loop through processMachines
          for (const machine of process.processMachines) {
            const mc = await ctx.prisma.machineCatalog.findFirst({
              select: {
                name: true,
                rate: true,
              },
              where: {
                id: machine.machineId,
              },
            });
            if (mc) {
              await ctx.prisma.costingOperations.create({
                data: {
                  quoteLineItemId: createdQuoteLineItem.id,
                  operationName: mc.name,
                  organizationId: current_user.organizationId,
                  createdByUserId: ctx.session.user.id,
                  rate: mc.rate ?? null,
                },
              });
            }
          }

          // Loop through processMaterials
          for (const material of process.processMaterials) {
            const mat = await ctx.prisma.materialCatalog.findFirst({
              select: {
                name: true,
                rate: true,
              },
              where: {
                id: material.materialId,
              },
            });
            if (mat) {
              await ctx.prisma.costingRawMaterial.create({
                data: {
                  quoteLineItemId: createdQuoteLineItem.id,
                  materialName: mat.name,
                  organizationId: current_user.organizationId,
                  createdByUserId: ctx.session.user.id,
                  unitCost: mat?.rate ?? null,
                },
              });
            }
          }
          return createdQuoteLineItem;
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to create quote line item", error);
      }
    }),
  updateQuoteLineItemName: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.quoteLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partName: input.partName,
              userId: ctx.session.user.id,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update quote line item", error);
      }
    }),
  updateQuoteLineItemDetails: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partDetails: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.quoteLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partDetails: input.partDetails,
              userId: ctx.session.user.id,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to updated quote line item", error);
      }
    }),
  updateQuoteLineItemCost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partCost: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.quoteLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partCost: input.partCost,
              userId: ctx.session.user.id,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update quote line item", error);
      }
    }),
  updateQuoteLineItemQuantity: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        partQuantity: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.quoteLineItem.update({
            where: {
              id: input.id,
            },
            data: {
              partQuantity: input.partQuantity,
              userId: ctx.session.user.id,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update quote line item", error);
      }
    }),
  getQuoteLineItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.quoteLineItem.findFirst({
            where: {
              organizationId: current_user.organizationId,
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
  getQuoteLineItems: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.quoteLineItem.findMany({
            where: {
              organizationId: current_user.organizationId,
              rfqId: input.id,
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
  deleteQuoteLineItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.quoteLineItem.delete({
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
  linkQuoteItemToQuoteFile: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
        quoteLineItemId: z.string(),
        quoteFileId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          select: {
            organizationId: true,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        if (!currentUser || !currentUser.organizationId) {
          return;
        }
        return await ctx.prisma.quoteLineItem.update({
          where: {
            id: input.quoteLineItemId,
            organizationId: currentUser.organizationId,
            rfqId: input.rfqId,
          },
          data: {
            quotePrimaryFileId: input.quoteFileId,
          },
        });
      } catch (error) {
        console.log("error", error);
      }
    }),
});
