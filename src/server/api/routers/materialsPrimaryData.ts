/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const orgMaterialsRouter = createTRPCRouter({
  createOrgMaterial: protectedProcedure
    .input(
      z.object({
        name: z.string(),
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
          return await ctx.prisma.materialCatalog.create({
            data: {
              name: input.name,
              rate: input.rate,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          throw new Error(
            "Could not create material item: Organization ID missing"
          );
        }
      } catch (error) {
        console.error("Failed to create material item", error);
        throw new Error("Failed to create material item");
      }
    }),
  getMaterial: protectedProcedure
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
          return await ctx.prisma.materialCatalog.findFirst({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          return null; // Return null or a default value if no material item is found
        }
      } catch (error) {
        console.error("Error fetching material item", error);
        throw new Error("Failed to fetch material item");
      }
    }),

  getOrgMaterials: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.materialCatalog.findMany({
          where: {
            organizationId: current_user.organizationId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      } else {
        return []; // Return an empty array if no material items are found
      }
    } catch (error) {
      console.error("Error fetching material items", error);
      throw new Error("Failed to fetch material items");
    }
  }),
  deleteMaterialCatalogItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.materialCatalog.delete({
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
  updateMaterial: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        rate: z.nullable(z.number()),
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
          return await ctx.prisma.materialCatalog.updateMany({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
            data: {
              name: input.name,
              rate: input.rate,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update material", error);
      }
    }),
  deleteMaterialItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.materialCatalog.delete({
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
