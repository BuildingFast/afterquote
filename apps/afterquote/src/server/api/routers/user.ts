/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type User } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUserNameById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.user.findFirst({
          select: {
            name: true,
          },
          where: {
            id: input.id ?? ctx.session.user.id,
          },
        });
      } catch (error) {
        console.log("error", error);
      }
    }),
  getUserOrganization: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.user.findFirst({
        select: {
          organizationId: true,
          isCustomer: true,
        },
        where: {
          id: ctx.session.user.id,
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  }),
  getUsersFromOrganization: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user: User | null = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (user && user.organizationId)
        return await ctx.prisma.user.findMany({
          select: {
            id: true,
            name: true,
          },
          where: {
            organizationId: user.organizationId,
          },
        });
    } catch (error) {
      console.log("error", error);
    }
  }),
  getUserRole: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.user.findFirst({
        select: {
          role: true,
        },
        where: {
          id: ctx.session.user.id,
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  }),
  updateUserOrganization: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
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
            organizationList: true,
          },
        });
        if (
          current_user &&
          current_user.organizationList &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          current_user.organizationList.indexOf(input.orgId) <= -1
        ) {
          return null;
        }
        if (
          current_user &&
          current_user?.organizationList &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          current_user?.organizationList.length <= 1
        ) {
          return null;
        }
        if (current_user && current_user.organizationId) {
          await ctx.prisma.user.update({
            data: {
              organizationId: input.orgId,
            },
            where: {
              id: ctx.session.user.id,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
});
