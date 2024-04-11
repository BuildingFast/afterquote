/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Postmark from "postmark";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});
// Create a new ratelimiter, that allows 5 requests per 5 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, "5 s"),
});

const client = process.env.POSTMARK_CLIENT
  ? new Postmark.ServerClient(process.env.POSTMARK_CLIENT)
  : null;
export const websiteFormRouter = createTRPCRouter({
  submitWidgetForm: publicProcedure
    .input(
      z.object({
        formWidgetId: z.string(),
        fullName: z.string(),
        phone: z.string(),
        email: z.string(),
        companyName: z.string(),
        quoteRequiredBy: z.date(),
        deliveryTime: z.string(),
        details: z.array(z.string()),
        message: z.string(),
        location: z.string(),
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
        let rfqtigerEmail = "";
        const current_org = await ctx.prisma.organization.findFirst({
          where: {
            formWidgetId: input.formWidgetId,
          },
          select: {
            id: true,
            name: true,
            rfqCustomFieldSchema: true,
            checkListSchema: true,
          },
        });
        if (client && input.formWidgetId) {
          await client.sendEmailWithTemplate(
            {
              From: process.env.POSTMARK_EMAIL_ID ?? "",
              To: process.env.POSTMARK_EMAIL_ID ?? "", //sales@ + current_org.name + .com
              TemplateAlias: "comment-notification",
              TemplateModel: {
                product_url: "",
                product_name: input.details.toString(),
                body:
                  "From: " +
                  input.fullName +
                  ", " +
                  input.companyName +
                  " - " +
                  input.email +
                  " | " +
                  input.phone +
                  "\n" +
                  "Location: " +
                  input.location +
                  "\n" +
                  input.message +
                  "\n" +
                  "\n Quote Required By: " +
                  input.quoteRequiredBy.toISOString().substring(0, 10) +
                  "\n" +
                  "\n Delivery Time: " +
                  input.deliveryTime,
                attachment_details: [
                  {
                    attachment_url: "attachment_url_Value",
                    attachment_name: "attachment_name_Value",
                    attachment_size: "attachment_size_Value",
                    attachment_type: "attachment_type_Value",
                  },
                ],
                commenter_name: input.fullName,
                timestamp: new Date(),
                company_name: current_org?.name ?? "",
                company_address: "",
              },
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
            },
            async (error, result) => {
              if (error) {
                console.error(error);
              } else if (result) {
                console.log(result);
                try {
                  const emailCreated = await ctx.prisma.email.create({
                    data: {
                      emailSubject: input.fullName + " " + input.companyName,
                      emailText: input.message,
                    },
                  });
                  rfqtigerEmail = emailCreated.id;
                } catch (error) {
                  console.log(error);
                }
              }
            }
          );
          if (!current_org) {
            console.log("Org not found");
            return;
          }
          const current_user = await ctx.prisma.user.findFirst({
            where: {
              email: "form@rfptiger.com",
            },
          });
          if (!current_user) {
            console.log("Form user not found");
            return;
          }
          const customer = await ctx.prisma.customer.create({
            data: {
              companyName: input.companyName,
              organizationId: current_org.id,
              userId: current_user.id,
            },
          });
          let newJson = undefined;
          if (current_org?.rfqCustomFieldSchema) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            newJson = Object.keys(current_org?.rfqCustomFieldSchema).reduce(
              (obj: { [key: string]: string }, key) => {
                obj[key] = "";
                return obj;
              },
              {}
            );
          }
          const checkListJson: { [x: string]: boolean } = {};
          if (current_org?.checkListSchema) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
            current_org?.checkListSchema.map(
              (item) => (checkListJson[item] = false)
            );
          }
          const rfq = await ctx.prisma.rfq.create({
            data: {
              customerId: customer.id,
              dateReceived: new Date(),
              dueDate: input.quoteRequiredBy,
              notes: input.message,
              city: input.location,
              organizationId: current_org.id,
              userId: current_user.id,
              customFields: newJson,
            },
          });
          if (rfq && rfqtigerEmail) {
            return await ctx.prisma.email.update({
              data: {
                rfqId: rfq.id,
              },
              where: {
                id: rfqtigerEmail,
              },
            });
          }
          return rfq;
        }
      } catch (error) {
        console.log(error);
      }
    }),
});
