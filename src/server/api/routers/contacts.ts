/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type User } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const contactsRouter = createTRPCRouter({
  createContact: protectedProcedure
    .input(
      z.object({
        contactFirstName: z.string(),
        contactLastName: z.string(),
        customerId: z.nullable(z.string()),
        contactNumber: z.nullable(z.string()),
        contactEmail: z.nullable(z.string()),
        contactNotes: z.nullable(z.string()),
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
          return await ctx.prisma.contact.create({
            data: {
              customerId: input.customerId,
              contactFirstName: input.contactFirstName,
              contactLastName: input.contactLastName,
              contactNumber: input.contactNumber,
              contactEmail: input.contactEmail,
              contactNotes: input.contactNotes,
              organizationId: current_user.organizationId,
              createdByuserId: ctx.session.user.id,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to create contact", error);
      }
    }),
  getContactsForAccount: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.contact.findMany({
            where: {
              customerId: input.customerId,
              organizationId: current_user.organizationId,
              deleted: null,
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getContacts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.contact.findMany({
          where: {
            organizationId: current_user.organizationId,
            deleted: null,
          },
        });
      } else {
        return [];
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getNoCustomerContacts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.contact.findMany({
          where: {
            organizationId: current_user.organizationId,
            customerId: null,
            deleted: null,
          },
        });
      } else {
        return [];
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  linkContactToCustomer: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        customerId: z.string(),
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
          return await ctx.prisma.contact.updateMany({
            where: {
              id: input.contactId,
              organizationId: current_user.organizationId,
            },
            data: {
              customerId: input.customerId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update contact", error);
      }
    }),
  updateContact: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        contactFirstName: z.string(),
        contactLastName: z.string(),
        contactNumber: z.nullable(z.string()),
        contactEmail: z.nullable(z.string()),
        contactNotes: z.nullable(z.string()),
        customerId: z.nullable(z.string()),
        customFields: z.nullable(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user: User | null = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.contact.updateMany({
            where: {
              id: input.contactId,
              organizationId: current_user.organizationId,
            },
            data: {
              contactFirstName: input.contactFirstName,
              contactLastName: input.contactLastName,
              contactNumber: input.contactNumber,
              contactEmail: input.contactEmail,
              contactNotes: input.contactNotes,
              customerId: input.customerId,
              customFields: input.customFields,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update contact", error);
      }
    }),
  getOne: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      const current_contact = await ctx.prisma.contact.findFirst({
        select: {
          customerId: true,
          contactFirstName: true,
          contactLastName: true,
          contactNumber: true,
          contactEmail: true,
          contactNotes: true,
          createdAt: true,
          organizationId: true,
          customFields: true,
        },
        where: {
          id: input,
          deleted: null,
        },
      });
      if (
        current_user &&
        current_contact &&
        current_user.organizationId === current_contact.organizationId
      ) {
        return current_contact;
      } else {
        console.log("unauthorized user");
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  deleteContact: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (!current_user || !current_user.organizationId) {
          return;
        }
        return await ctx.prisma.contact.update({
          where: {
            id: input,
            organizationId: current_user.organizationId,
          },
          data: {
            deleted: new Date(),
          },
        });
      } catch (error) {
        console.log("Failed to delete contact", error);
      }
    }),
});
