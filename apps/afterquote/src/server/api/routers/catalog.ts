import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const catalogRouter = createTRPCRouter({
  createCatalog: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        unitCost: z.number(),
        units: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
          const catalog = await ctx.prisma.productsCatalog.create({
            data: {
              name: input.name,
              unitCost: input.unitCost,
              units: input.units,
              organizationId: current_user.organizationId,
              userId: ctx.session.user.id,
            },
          });
          return catalog;
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to create catalog item", error);
      }
    }),
  getOne: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      const currentUser = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (currentUser && currentUser.organizationId) {
        const catalog = await ctx.prisma.productsCatalog.findFirst({
          select: {
            id: true,
            name: true,
            unitCost: true,
            units: true,
            pricingRules: true,
          },
          where: {
            id: input,
            organizationId: currentUser?.organizationId,
          },
        });
        return catalog;
      } else {
        console.log("Could not get organization id or unauthorized user");
      }
    } catch (error) {
      console.log("Failed to get catalog item", error);
    }
  }),
  getOnePublic: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const catalog = await ctx.prisma.productsCatalog.findFirst({
          select: {
            name: true,
            unitCost: true,
            units: true,
          },
          where: {
            id: input,
          },
        });
        return catalog;
      } catch (error) {
        console.log("Failed to get catalog item", error);
      }
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const currentUser = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (currentUser && currentUser.organizationId) {
        const catalog = await ctx.prisma.productsCatalog.findMany({
          select: {
            id: true,
            name: true,
            unitCost: true,
            units: true,
            pricingRules: true,
          },
          where: {
            organizationId: currentUser.organizationId,
          },
        });
        return catalog;
      } else {
        return [];
      }
    } catch (error) {
      console.log("Failed to get catalog items", error);
    }
  }),
  updateCatalog: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.nullable(z.string()),
        unitCost: z.nullable(z.number()),
        units: z.nullable(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          const catalog = await ctx.prisma.productsCatalog.update({
            where: {
              id: input.id,
              organizationId: currentUser.organizationId,
            },
            data: {
              name: input.name,
              unitCost: input.unitCost,
              units: input.units,
            },
          });
          return catalog;
        } else {
          console.log("Could not get organization id or unauthorized user");
        }
      } catch (error) {
        console.log("Failed to update catalog item", error);
      }
    }),
  deleteCatalog: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          const catalog = await ctx.prisma.productsCatalog.delete({
            where: {
              id: input,
              organizationId: currentUser.organizationId,
            },
          });
          return catalog;
        } else {
          console.log("Could not get organization id or unauthorized user");
        }
      } catch (error) {
        console.log("Failed to delete catalog item", error);
      }
    }),
});
