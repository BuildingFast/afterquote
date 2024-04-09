/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const orgOperationsRouter = createTRPCRouter({
  createOrgOperation: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        rate: z.nullable(z.number()),
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
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.operationsCatalog.create({
            data: {
              name: input.name,
              rate: input.rate,
              toolingRate: input.toolingRate,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          throw new Error(
            "Could not create operation item: Organization ID missing"
          );
        }
      } catch (error) {
        console.error("Failed to create operation item", error);
        throw new Error("Failed to create operation item");
      }
    }),
  getOperation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.operationsCatalog.findFirst({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          return null; // Return null or a default value if no operation item is found
        }
      } catch (error) {
        console.error("Error fetching operation item", error);
        throw new Error("Failed to fetch operation item");
      }
    }),

  getOrgOperations: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.operationsCatalog.findMany({
          where: {
            organizationId: current_user.organizationId,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            organizationId: true,
            name: true,
            rate: true,
            machines: {
              select: {
                machine: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      } else {
        return []; // Return an empty array if no operation items are found
      }
    } catch (error) {
      console.error("Error fetching operation items", error);
      throw new Error("Failed to fetch operation items");
    }
  }),
  deleteOperationCatalogItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.operationsCatalog.delete({
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
  updateOperation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        rate: z.nullable(z.number()),
        toolingRate: z.nullable(z.number()),
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
          return await ctx.prisma.operationsCatalog.updateMany({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
            data: {
              name: input.name,
              rate: input.rate,
              toolingRate: input.toolingRate,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update operation", error);
      }
    }),
  deleteOperationItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.operationsCatalog.delete({
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
