/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});
// Create a new ratelimiter, that allows 5 requests per 5 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, "5 s"),
});

enum QualityDecision {
  HOLD,
  REJECT,
}

export const rejectionFormRouter = createTRPCRouter({
  submitRejectionForm: publicProcedure
    .input(
      z.object({
        formWidgetId: z.string(),
        rollNumber: z.string(),
        customer: z.string(),
        dateOfRejection: z.date(),
        actualWidth: z.number(),
        actualLength: z.number(),
        qualityDecision: z.nativeEnum(QualityDecision),
        qualityObservation: z.string(),
        disposableMaterials: z.string(),
        submittedBy: z.string(),
        shiftNumber: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const identifier = input.formWidgetId;
        const rate_limit_checker = await ratelimit.limit(identifier);
        if (!rate_limit_checker.success) {
          console.log("The request has been rate limited");
          return {
            message: "The request has been rate limited.",
            rateLimitState: rate_limit_checker,
          };
        }
        console.log("yeet", input.formWidgetId);
        const current_org = await ctx.prisma.organization.findFirst({
          where: {
            formWidgetId: input.formWidgetId,
          },
          select: {
            id: true,
          },
        });
        console.log("yeet", current_org);
        if (!current_org || !current_org.id) {
          console.log("Org not found");
          return;
        }
        if (!input.formWidgetId) {
          return;
        }
        return await ctx.prisma.qualityRejection.create({
          data: {
            organizationId: current_org.id,
            rollNumber: input.rollNumber,
            customer: input.customer,
            dateOfRejection: input.dateOfRejection,
            actualWidth: input.actualWidth,
            actualLength: input.actualLength,
            qualityDecision: QualityDecision[input.qualityDecision],
            qualityObservation: input.qualityObservation,
            disposableMaterials: input.disposableMaterials,
            submittedBy: input.submittedBy,
            shiftNumber: input.shiftNumber,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  getRejections: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.qualityRejection.findMany({
          where: {
            organizationId: current_user.organizationId,
          },
        });
      } else {
        return [];
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
});
