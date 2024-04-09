/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { type User, RfqStatus, RfqPriority } from "@prisma/client";
import { z } from "zod";
import { NotificationPurpose } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const rfqRouter = createTRPCRouter({
  createRfq: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        companyEmail: z.nullable(z.string()),
        rfqNumber: z.nullable(z.string()),
        city: z.nullable(z.string()),
        country: z.nullable(z.string()),
        dateReceived: z.nullable(z.date()),
        dueDate: z.nullable(z.date()),
        responseDate: z.nullable(z.date()),
        notes: z.nullable(z.string()),
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
          const current_org = await ctx.prisma.organization.findFirst({
            where: {
              id: current_user.organizationId,
            },
            select: {
              rfqCustomFieldSchema: true,
              checkListSchema: true,
              users: true,
            },
          });
          const rfqCount = await ctx.prisma.rfq.count({
            where: {
              organizationId: current_user.organizationId,
            },
          });
          const fullYear = new Date().getFullYear(); // Get the full year, e.g., 2023
          const lastTwoDigits = fullYear.toString().slice(-2); // Get the last two digits
          const rfqNumber = `${lastTwoDigits}-${(rfqCount + 1)
            .toString()
            .padStart(4, "0")}`;
          let customFieldJson = undefined;
          if (current_org?.rfqCustomFieldSchema) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            customFieldJson = Object.keys(
              current_org?.rfqCustomFieldSchema
            ).reduce((obj: { [key: string]: string }, key) => {
              obj[key] = "";
              return obj;
            }, {});
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
              customerId: input.customerId,
              dateReceived: input.dateReceived,
              rfqNumber: rfqNumber,
              dueDate: input.dueDate,
              responseDate: input.responseDate,
              notes: input.notes,
              city: input.city,
              country: input.country,
              organizationId: current_user.organizationId,
              userId: ctx.session.user.id,
              updatedById: ctx.session.user.id,
              customFields: customFieldJson,
              checkList: checkListJson,
            },
          });
          const current_customer = await ctx.prisma.customer.findFirst({
            where: {
              id: input.customerId,
            },
            select: {
              companyName: true,
            },
          });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          const notifications_to_create = current_org?.users.map((usr) => {
            return {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              message:
                "New RFQ Received " +
                (current_customer?.companyName
                  ? "from " + current_customer?.companyName
                  : ""),
              purpose: NotificationPurpose.RfqCreated,
              userId: usr.id,
              organizationId: current_user.organizationId ?? "",
              rfqId: rfq.id,
            };
          });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          await ctx.prisma.notification.createMany({
            data: notifications_to_create ?? [],
          });
          return rfq;
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to create rfq", error);
      }
    }),
  getRfqs: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.rfq.findMany({
          orderBy: {
            dateReceived: "asc",
          },
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
  getCustomerPortalRfqs: protectedProcedure.query(async ({ ctx }) => {
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
        const org = await ctx.prisma.organization.findFirst({
          where: {
            id: current_user.organizationId,
          },
          select: {
            associatedCustomerId: true,
          },
        });
        if (org && org.associatedCustomerId) {
          return await ctx.prisma.rfq.findMany({
            select: {
              id: true,
              rfqNumber: true,
              dateReceived: true,
              orderValue: true,
              currency: true,
              organizationId: true,
            },
            where: {
              customerId: org.associatedCustomerId,
              rfqVisibleToCustomer: true,
              deleted: null,
            },
          });
        } else {
          return [];
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  updateRfq: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
        rfqNumber: z.nullable(z.string()),
        dateReceived: z.nullable(z.date()),
        dueDate: z.nullable(z.date()),
        responseDate: z.nullable(z.date()),
        notes: z.nullable(z.string()),
        addressOne: z.nullable(z.string()),
        addressTwo: z.nullable(z.string()),
        addressZip: z.nullable(z.string()),
        addressState: z.nullable(z.string()),
        city: z.nullable(z.string()),
        country: z.nullable(z.string()),
        customFields: z.nullable(z.any()),
        checkListFields: z.nullable(z.any()),
        salesPersonId: z.nullable(z.string()),
        estimatorId: z.nullable(z.string()),
        status: z.nativeEnum(RfqStatus),
        priority: z.nativeEnum(RfqPriority),
        currency: z.nullable(z.string()),
        orderValue: z.nullable(z.number()),
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
          return await ctx.prisma.rfq.update({
            where: {
              id: input.rfqId,
              organizationId: current_user.organizationId,
            },
            data: {
              dateReceived: input.dateReceived,
              rfqNumber: input.rfqNumber,
              dueDate: input.dueDate,
              responseDate: input.responseDate,
              notes: input.notes,
              addressOne: input.addressOne,
              addressTwo: input.addressTwo,
              addressState: input.addressState,
              addressZip: input.addressZip,
              city: input.city,
              country: input.country,
              salesPersonId: input.salesPersonId,
              estimatorId: input.estimatorId,
              status: input.status,
              priority: input.priority,
              updatedById: ctx.session.user.id,
              customFields: input.customFields,
              checkList: input.checkListFields,
              currency: input.currency,
              orderValue: input.orderValue,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update rfq", error);
      }
    }),
  updateRfqCustomFields: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
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
          return await ctx.prisma.rfq.update({
            where: {
              id: input.rfqId,
              organizationId: current_user.organizationId,
            },
            data: {
              customFields: input.customFields,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update rfq", error);
      }
    }),
  getRfqCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        const rfq_count = await ctx.prisma.rfq.count({
          where: {
            organizationId: current_user.organizationId,
            deleted: null,
          },
        });
        return rfq_count;
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getTotalOrderValue: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        const orders = await ctx.prisma.rfq.findMany({
          where: {
            organizationId: current_user.organizationId,
            deleted: null,
          },
          select: {
            orderValue: true,
          },
        });

        let totalOrderValue = 0;
        for (const order of orders) {
          totalOrderValue += order.orderValue ? Number(order.orderValue) : 0;
        }

        return totalOrderValue;
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOne: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      const current_rfq = await ctx.prisma.rfq.findFirst({
        select: {
          customerId: true,
          salesPersonId: true,
          estimatorId: true,
          dateReceived: true,
          rfqNumber: true,
          dueDate: true,
          responseDate: true,
          notes: true,
          addressOne: true,
          addressTwo: true,
          addressZip: true,
          addressState: true,
          city: true,
          country: true,
          organizationId: true,
          quoteLineItems: true,
          customFields: true,
          rfqVisibleToCustomer: true,
          status: true,
          priority: true,
          updatedAt: true,
          updatedById: true,
          createdAt: true,
          userId: true,
          checkList: true,
          currency: true,
          orderValue: true,
        },
        where: {
          id: input,
          deleted: null,
        },
      });
      if (
        current_user &&
        current_rfq &&
        current_user.organizationId === current_rfq.organizationId
      ) {
        return current_rfq;
      } else {
        console.log("unauthorized user");
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOneCustomerPortal: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_rfq = await ctx.prisma.rfq.findFirst({
          select: {
            dateReceived: true,
            rfqNumber: true,
            dueDate: true,
            responseDate: true,
            customFields: true,
            rfqVisibleToCustomer: true,
            updatedById: true,
            updatedAt: true,
            userId: true,
            status: true,
          },
          where: {
            id: input,
            deleted: null,
            rfqVisibleToCustomer: true,
          },
        });
        return current_rfq;
      } catch (error) {
        console.log("error", error);
      }
    }),
  getRfqCustomerName: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        const current_customer = await ctx.prisma.rfq.findUnique({
          where: {
            id: input,
            deleted: null,
          },
          select: {
            customer: {
              select: {
                companyName: true,
                organizationId: true,
              },
            },
          },
        });
        if (
          current_user?.organizationId ===
          current_customer?.customer.organizationId
        ) {
          return current_customer?.customer.companyName;
        } else {
          return "";
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getRfqNumber: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        const current_rfq = await ctx.prisma.rfq.findUnique({
          where: {
            id: input,
            deleted: null,
          },
          select: {
            rfqNumber: true,
            organizationId: true,
          },
        });
        if (current_user?.organizationId === current_rfq?.organizationId) {
          return current_rfq?.rfqNumber;
        } else {
          return "";
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateRfqVisibility: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
        visibility: z.boolean(),
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
          if (current_user.role == "ADMIN" || current_user.role == "OWNER") {
            return await ctx.prisma.rfq.update({
              data: {
                rfqVisibleToCustomer: input.visibility,
              },
              where: {
                id: input.rfqId,
              },
            });
          } else {
            console.log("unauthorized user");
          }
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Error updating file visibility", error);
      }
    }),
  deleteRfq: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          if (current_user.role == "ADMIN" || current_user.role == "OWNER") {
            return await ctx.prisma.rfq.update({
              where: {
                id: input,
                organizationId: current_user.organizationId,
              },
              data: {
                deleted: new Date(),
              },
            });
          } else {
            console.log("unauthorized user");
          }
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to delete rfq", error);
      }
    }),
  convertRfqToSalesOrder: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
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
        if (!current_user || !current_user.organizationId) {
          return;
        }

        const rfq = await ctx.prisma.rfq.findFirst({
          where: {
            id: input.rfqId,
            organizationId: current_user.organizationId,
          },
        });

        if (!rfq) {
          throw new Error("RFQ not found");
        }

        const salesOrderCount = await ctx.prisma.salesOrder.count({
          where: {
            organizationId: current_user.organizationId,
          },
        });
        const fullYear = new Date().getFullYear(); // Get the full year, e.g., 2023
        const lastTwoDigits = fullYear.toString().slice(-2); // Get the last two digits
        const poNumber = `${lastTwoDigits}-${(salesOrderCount + 1)
          .toString()
          .padStart(4, "0")}`;
        const newSalesOrder = await ctx.prisma.salesOrder.create({
          data: {
            poNumber: poNumber,
            dateReceived: rfq.dateReceived,
            dueDate: rfq.dueDate,
            updatedById: ctx.session.user.id,
            notes: rfq.notes,
            addressOne: rfq.addressOne,
            addressTwo: rfq.addressTwo,
            addressZip: rfq.addressZip,
            addressState: rfq.addressState,
            city: rfq.city,
            country: rfq.country,
            userId: rfq.userId,
            customerId: rfq.customerId,
            organizationId: rfq.organizationId,
            priority: rfq.priority,
            currency: rfq.currency,
            orderValue: rfq.orderValue,
            deleted: rfq.deleted,
            createdFromRfqId: rfq.id,
          },
        });

        await ctx.prisma.rfq.update({
          where: { id: input.rfqId },
          data: { converted: true },
        });

        return newSalesOrder;
      } catch (error) {
        console.log(`Failed to convert RFQ to sales order: ${String(error)}`);
        throw new Error("Failed to convert RFQ to sales order");
      }
    }),
  getRfqConverted: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        if (!current_user || !current_user.organizationId) {
          return;
        }
        const rfq = await ctx.prisma.rfq.findUnique({
          where: { id: input, organizationId: current_user.organizationId },
          select: { converted: true },
        });
        if (!rfq) {
          throw new Error("RFQ not found");
        }
        return rfq;
      } catch (error) {
        console.error(`Failed to fetch RFQ: ${String(error)}`);
        throw new Error("Failed to fetch RFQ");
      }
    }),
});
