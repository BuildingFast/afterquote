/* eslint-disable @typescript-eslint/no-misused-promises */
import * as Postmark from "postmark";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const client = process.env.POSTMARK_CLIENT
  ? new Postmark.ServerClient(process.env.POSTMARK_CLIENT)
  : null;
export const inviteRouter = createTRPCRouter({
  acceptInvite: protectedProcedure
    .input(
      z.object({
        tokenId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const invitation = await ctx.prisma.invitation.findFirst({
          where: {
            token: input.tokenId,
            email: ctx.session.user.email ?? "",
          },
        });
        if (invitation?.isCustomer && invitation?.contactId) {
          const customerContact = await ctx.prisma.contact.findFirst({
            where: {
              id: invitation?.contactId,
            },
            select: {
              customerId: true,
            },
          });
          if (customerContact?.customerId) {
            const currentCustomer = await ctx.prisma.customer.findFirst({
              where: {
                id: customerContact?.customerId,
              },
              select: {
                companyName: true,
                customerPortalEnabled: true,
                associatedCustomerOrg: true,
              },
            });
            if (
              currentCustomer?.associatedCustomerOrg &&
              currentCustomer?.associatedCustomerOrg.length < 1 &&
              currentCustomer?.companyName
            ) {
              const createdOrg = await ctx.prisma.organization.create({
                data: {
                  name: currentCustomer?.companyName,
                  isCustomer: true,
                },
              });
              await ctx.prisma.user.update({
                data: {
                  organizationId: createdOrg.id,
                  isCustomer: true,
                },
                where: {
                  id: ctx.session.user.id,
                },
              });
              await ctx.prisma.invitation.update({
                data: {
                  status: "ACCEPTED",
                },
                where: {
                  token: input.tokenId,
                },
              });
              await ctx.prisma.organization.update({
                data: {
                  associatedCustomerId: customerContact?.customerId,
                },
                where: {
                  id: createdOrg.id,
                },
              });
            } else {
              await ctx.prisma.user.update({
                data: {
                  organizationId: currentCustomer?.associatedCustomerOrg[0]?.id,
                  isCustomer: true,
                },
                where: {
                  id: ctx.session.user.id,
                },
              });
              await ctx.prisma.invitation.update({
                data: {
                  status: "ACCEPTED",
                },
                where: {
                  token: input.tokenId,
                },
              });
            }
          }
          const org = await ctx.prisma.organization.findFirst({
            where: {
              id: invitation?.organizationId,
            },
            select: {
              users: true,
            },
          });
          org?.users.map(async (user) => {
            if (user.role === "ADMIN" || user.role === "OWNER") {
              await ctx.prisma.notification.create({
                data: {
                  userId: user.id,
                  message:
                    "Invite Accepted for Customer Portal - " +
                    (ctx.session.user.name ?? ""),
                  purpose: "InviteAccepted",
                  organizationId: invitation?.organizationId,
                },
              });
            }
          });
          return;
        }
        if (invitation && invitation.status === "PENDING") {
          await ctx.prisma.user.update({
            data: {
              organizationId: invitation.organizationId,
            },
            where: {
              id: ctx.session.user.id,
            },
          });
          await ctx.prisma.invitation.update({
            data: {
              status: "ACCEPTED",
            },
            where: {
              token: input.tokenId,
            },
          });
          const org = await ctx.prisma.organization.findFirst({
            where: {
              id: invitation.organizationId,
            },
            select: {
              users: true,
            },
          });
          org?.users.map(async (user) => {
            if (user.role === "ADMIN" || user.role === "OWNER") {
              await ctx.prisma.notification.create({
                data: {
                  userId: user.id,
                  message:
                    (ctx.session.user.name ?? "") + " Joined your Organization",
                  purpose: "InviteAccepted",
                  organizationId: invitation.organizationId,
                },
              });
            }
          });
        }
      } catch (error) {
        console.log("Failed to accept invite", error);
      }
    }),
  createInvite: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        orgName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const generated_token = String(uuidv4());
        if (client) {
          const currentUser = await ctx.prisma.user.findFirst({
            select: {
              role: true,
              organizationId: true,
            },
            where: {
              id: ctx.session.user.id,
            },
          });
          if (currentUser && currentUser.organizationId) {
            const invite = await ctx.prisma.invitation.create({
              data: {
                email: input.email,
                organizationId: currentUser.organizationId,
                token: generated_token,
              },
            });
            const orgName = await ctx.prisma.organization.findUnique({
              where: {
                id: currentUser.organizationId,
              },
            });
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            const clientUrl = `${process.env.NEXT_PUBLIC_URL}/auth/signin/${invite.token}`;
            await client.sendEmailWithTemplate(
              {
                From: process.env.POSTMARK_EMAIL_ID ?? "",
                To: input.email,
                TemplateAlias: "user-invitation",
                TemplateModel: {
                  product_url: "product_url_Value",
                  product_name: "RfqTiger",
                  invite_sender_name: orgName ? orgName.name : "RfqTiger",
                  invite_sender_organization_name: orgName
                    ? orgName.name
                    : "RfqTiger",
                  action_url: clientUrl,
                  support_email: "info@rfqtiger.com",
                  live_chat_url: "live_chat_url_Value",
                  help_url: "rfqtiger.com",
                  company_name: "RfqTiger",
                  company_address: "Philadelphia, PA",
                },
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
              },
              async (error, result) => {
                if (error) {
                  console.error(error);
                } else if (result) {
                  console.log(result);
                  try {
                    await ctx.prisma.invitationEmailSends.create({
                      data: {
                        email: input.email,
                        emailService: "Postmark",
                        invitationId: invite.id,
                      },
                    });
                  } catch (error) {
                    console.log(error);
                  }
                }
              }
            );
          }
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  createInviteForCustomerPortal: protectedProcedure
    .input(
      z.object({
        contactId: z.nullable(z.string()),
        orgName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const generated_token = String(uuidv4());
        if (client) {
          const currentUser = await ctx.prisma.user.findFirst({
            select: {
              role: true,
              organizationId: true,
            },
            where: {
              id: ctx.session.user.id,
            },
          });
          if (!input.contactId) {
            console.log("No valid contact id provided");
            return;
          }
          const currentContact = await ctx.prisma.contact.findFirst({
            select: {
              contactEmail: true,
            },
            where: {
              id: input.contactId,
            },
          });
          if (!currentContact || !currentContact?.contactEmail) {
            console.log("Could not find contact email");
            return;
          }
          if (currentUser && currentUser.organizationId) {
            const invite = await ctx.prisma.invitation.create({
              data: {
                email: currentContact.contactEmail,
                organizationId: currentUser.organizationId,
                token: generated_token,
                isCustomer: true,
                contactId: input.contactId,
              },
            });
            const orgName = await ctx.prisma.organization.findUnique({
              where: {
                id: currentUser.organizationId,
              },
            });
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            const clientUrl = `${process.env.NEXT_PUBLIC_URL}/auth/signin/${invite.token}`;
            const emailSend = await client.sendEmailWithTemplate(
              {
                From: process.env.POSTMARK_EMAIL_ID ?? "",
                To: currentContact?.contactEmail,
                TemplateAlias: "customer-portal-invitation",
                TemplateModel: {
                  product_url: "product_url_Value",
                  product_name: "RfqTiger",
                  invite_sender_name: orgName ? orgName.name : "RfqTiger",
                  invite_sender_organization_name: orgName
                    ? orgName.name
                    : "RfqTiger",
                  action_url: clientUrl,
                  support_email: "info@rfqtiger.com",
                  live_chat_url: "live_chat_url_Value",
                  help_url: "rfqtiger.com",
                  company_name: "RfqTiger",
                  company_address: "Philadelphia, PA",
                },
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
              },
              async (error, result) => {
                if (error) {
                  console.error(error);
                } else if (result) {
                  console.log(result);
                  try {
                    await ctx.prisma.invitationEmailSends.create({
                      data: {
                        email:
                          currentContact?.contactEmail ??
                          "emailnotfound@rfqtiger.com",
                        emailService: "Postmark",
                        invitationId: invite.id,
                      },
                    });
                  } catch (error) {
                    console.log(error);
                  }
                }
              }
            );
            return emailSend;
          }
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
});
