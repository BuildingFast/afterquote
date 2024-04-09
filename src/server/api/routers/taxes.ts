import { TaxType } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const taxRouter = createTRPCRouter({
  createTaxItem: protectedProcedure
    .input(
      z.object({
        taxType: z.nativeEnum(TaxType),
        taxRegion: z.string(),
        taxRate: z.number(),
        taxDesc: z.nullable(z.string()),
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
          const newTaxItem = await ctx.prisma.taxes.create({
            data: {
              type: input.taxType,
              region: input.taxRegion,
              rate: input.taxRate,
              description: input.taxDesc,
              userId: ctx.session.user.id,
              organizationId: current_user.organizationId,
            },
          });
          return newTaxItem;
        } else {
          throw new Error("Could not create tax item: Organization ID missing");
        }
      } catch (error) {
        console.error("Failed to create tax item", error);
        throw new Error("Failed to create tax item");
      }
    }),
  updateTaxRate: protectedProcedure
    .input(
      z.object({
        taxItemId: z.string(),
        TaxRate: z.number(),
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
          return await ctx.prisma.taxes.update({
            where: {
              id: input.taxItemId,
              organizationId: current_user.organizationId,
            },
            data: {
              rate: input.TaxRate,
            },
          });
        } else {
          throw new Error("Could not update tax rate: Organization ID missing");
        }
      } catch (error) {
        console.error("Failed to update tax rate", error);
        throw new Error("Failed to update tax rate");
      }
    }),
  updateTaxDesc: protectedProcedure
    .input(
      z.object({
        taxItemId: z.string(),
        TaxDesc: z.string(),
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
          return await ctx.prisma.taxes.update({
            where: {
              id: input.taxItemId,
              organizationId: current_user.organizationId,
            },
            data: {
              description: input.TaxDesc,
            },
          });
        } else {
          throw new Error(
            "Could not update tax description: Organization ID missing"
          );
        }
      } catch (error) {
        console.error("Failed to update tax description", error);
        throw new Error("Failed to update tax description");
      }
    }),
  updateTaxRegion: protectedProcedure
    .input(
      z.object({
        taxItemId: z.string(),
        TaxRegion: z.string(),
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
          return await ctx.prisma.taxes.update({
            where: {
              id: input.taxItemId,
              organizationId: current_user.organizationId,
            },
            data: {
              region: input.TaxRegion,
            },
          });
        } else {
          throw new Error(
            "Could not update tax region: Organization ID missing"
          );
        }
      } catch (error) {
        console.error("Failed to update tax region", error);
        throw new Error("Failed to update tax region");
      }
    }),
  updateTaxType: protectedProcedure
    .input(
      z.object({
        taxItemId: z.string(),
        TaxType: z.nativeEnum(TaxType),
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
          return await ctx.prisma.taxes.update({
            where: {
              id: input.taxItemId,
              organizationId: current_user.organizationId,
            },
            data: {
              type: input.TaxType,
            },
          });
        } else {
          throw new Error("Could not update tax type: Organization ID missing");
        }
      } catch (error) {
        console.error("Failed to update tax type", error);
        throw new Error("Failed to update tax type");
      }
    }),

  getTaxItem: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.taxes.findFirst({
          where: {
            organizationId: current_user.organizationId,
          },
        });
      } else {
        return null; // Return null or a default value if no tax item is found
      }
    } catch (error) {
      console.error("Error fetching tax item", error);
      throw new Error("Failed to fetch tax item");
    }
  }),

  getTaxItems: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.taxes.findMany({
          where: {
            organizationId: current_user.organizationId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      } else {
        return []; // Return an empty array if no tax items are found
      }
    } catch (error) {
      console.error("Error fetching tax items", error);
      throw new Error("Failed to fetch tax items");
    }
  }),
  getOne: protectedProcedure.input(z.string()).query(async ({ ctx }) => {
    try {
      const currentUser = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      const currentTaxItem = await ctx.prisma.taxes.findFirst({
        select: {
          type: true,
          region: true,
          description: true,
          rate: true,
          createdAt: true,
          organizationId: true,
          user: true,
          userId: true,
        },
      });
      if (
        currentUser &&
        currentTaxItem &&
        currentUser.organizationId === currentTaxItem.organizationId
      ) {
        return currentTaxItem;
      } else {
        console.log("unauthorized user");
      }
    } catch (error) {
      console.log("error", error);
    }
  }),

  deleteTaxItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.taxes.delete({
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
