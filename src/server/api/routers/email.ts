import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const emailRouter = createTRPCRouter({
  getEmailsForRfq: protectedProcedure
    .input(z.object({ rfqId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const emails = await ctx.prisma.email.findFirst({
          select: {
            emailSubject: true,
            emailText: true,
          },
          where: {
            rfqId: input.rfqId,
          },
        });
        return emails;
      } catch (error) {
        console.log("Error getting emails", error);
      }
    }),
});
