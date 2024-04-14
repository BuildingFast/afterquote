/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { User } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const costingRouter = createTRPCRouter({
  getQuoteLineItemCostingDetails: protectedProcedure
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
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getQuoteLineItemMaterialCosting: protectedProcedure
    .input(z.object({ quoteLineItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingRawMaterial.findMany({
            where: {
              organizationId: current_user.organizationId,
              quoteLineItemId: input.quoteLineItemId,
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
  getQuoteLineItemOperationsCosting: protectedProcedure
    .input(z.object({ quoteLineItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingOperations.findMany({
            where: {
              organizationId: current_user.organizationId,
              quoteLineItemId: input.quoteLineItemId,
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
  getQuoteLineItemToolingCosting: protectedProcedure
    .input(z.object({ quoteLineItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingTooling.findMany({
            where: {
              organizationId: current_user.organizationId,
              quoteLineItemId: input.quoteLineItemId,
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
  getQuoteLineItemOverallCosting: protectedProcedure
    .input(z.object({ quoteLineItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          const costingOperations = await ctx.prisma.costingOperations.findMany(
            {
              where: {
                organizationId: current_user.organizationId,
                quoteLineItemId: input.quoteLineItemId,
              },
            }
          );
          const costingTooling = await ctx.prisma.costingTooling.findMany({
            where: {
              organizationId: current_user.organizationId,
              quoteLineItemId: input.quoteLineItemId,
            },
          });
          const costingMaterials = await ctx.prisma.costingRawMaterial.findMany(
            {
              where: {
                organizationId: current_user.organizationId,
                quoteLineItemId: input.quoteLineItemId,
              },
            }
          );
          return {
            costingMaterialList: costingMaterials,
            costingOperationList: costingOperations,
            costingToolingList: costingTooling,
          };
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  createMaterialCostingItem: protectedProcedure
    .input(
      z.object({
        quoteLineItemId: z.string(),
        materialName: z.string(),
        rate: z.nullable(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingRawMaterial.create({
            data: {
              quoteLineItemId: input.quoteLineItemId,
              materialName: input.materialName,
              organizationId: current_user.organizationId,
              createdByUserId: ctx.session.user.id,
              unitCost: input.rate,
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  createOperationCostingItem: protectedProcedure
    .input(
      z.object({
        quoteLineItemId: z.string(),
        operationName: z.string(),
        rate: z.nullable(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingOperations.create({
            data: {
              quoteLineItemId: input.quoteLineItemId,
              operationName: input.operationName,
              organizationId: current_user.organizationId,
              createdByUserId: ctx.session.user.id,
              rate: input.rate,
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  createToolingCostingItem: protectedProcedure
    .input(
      z.object({
        quoteLineItemId: z.string(),
        toolingName: z.string(),
        rate: z.nullable(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingTooling.create({
            data: {
              quoteLineItemId: input.quoteLineItemId,
              name: input.toolingName,
              organizationId: current_user.organizationId,
              createdByUserId: ctx.session.user.id,
              rate: input.rate,
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getCostingMaterialItem: protectedProcedure
    .input(z.object({ materialCostingItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingRawMaterial.findFirst({
            where: {
              id: input.materialCostingItemId,
              organizationId: current_user.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateCostingMaterialItem: protectedProcedure
    .input(
      z.object({
        materialCostingItemId: z.string(),
        materialName: z.string(),
        unitCost: z.nullable(z.number()),
        costingJson: z.nullable(z.any()),
        materialMarkup: z.nullable(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (
          current_user &&
          current_user.organizationId &&
          input.materialName.length > 0
        ) {
          return await ctx.prisma.costingRawMaterial.update({
            where: {
              id: input.materialCostingItemId,
              organizationId: current_user.organizationId,
            },
            data: {
              materialName: input.materialName,
              costingJson: input.costingJson,
              unitCost: input.unitCost,
              materialMarkup: input.materialMarkup,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getCostingOperationItem: protectedProcedure
    .input(z.object({ operationCostingItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingOperations.findFirst({
            where: {
              id: input.operationCostingItemId,
              organizationId: current_user.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getCostingToolingItem: protectedProcedure
    .input(z.object({ toolingCostingItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.costingTooling.findFirst({
            where: {
              id: input.toolingCostingItemId,
              organizationId: current_user.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateCostingOperationItem: protectedProcedure
    .input(
      z.object({
        operationCostingItemId: z.string(),
        operationName: z.string(),
        setUpTimeMinutes: z.nullable(z.number()),
        runTimeMinutes: z.nullable(z.number()),
        rate: z.nullable(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (
          current_user &&
          current_user.organizationId &&
          input.operationName.length > 0
        ) {
          return await ctx.prisma.costingOperations.update({
            where: {
              id: input.operationCostingItemId,
              organizationId: current_user.organizationId,
            },
            data: {
              operationName: input.operationName,
              setUpTimeMinutes: input.setUpTimeMinutes,
              runTimeMinutes: input.runTimeMinutes,
              rate: input.rate,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateCostingToolingItem: protectedProcedure
    .input(
      z.object({
        toolingCostingItemId: z.string(),
        toolingOperationName: z.string(),
        toolingLength: z.nullable(z.number()),
        toolingWidth: z.nullable(z.number()),
        toolingHeight: z.nullable(z.number()),
        toolingWeight: z.nullable(z.number()),
        toolingFactor: z.nullable(z.number()),
        toolingRate: z.nullable(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (
          current_user &&
          current_user.organizationId &&
          input.toolingOperationName.length > 0
        ) {
          return await ctx.prisma.costingTooling.update({
            where: {
              id: input.toolingCostingItemId,
              organizationId: current_user.organizationId,
            },
            data: {
              name: input.toolingOperationName,
              toolingLength: input.toolingLength,
              toolingWidth: input.toolingWidth,
              toolingHeight: input.toolingHeight,
              toolingWeight: input.toolingWeight,
              toolingFactor: input.toolingFactor,
              rate: input.toolingRate,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  deleteMaterialCostingItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.costingRawMaterial.delete({
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
  deleteOperationCostingItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.costingOperations.delete({
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
  deleteToolingCostingItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.costingTooling.delete({
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
  getMaterialCostingJson: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          organizationId: true,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.organization.findFirst({
          where: {
            id: current_user.organizationId,
          },
          select: {
            materialCostingFields: true,
            materialCostingFormula: true,
          },
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
});
