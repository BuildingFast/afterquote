/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { OrderPriority } from "@prisma/client";
import { z } from "zod";
import { NotificationPurpose } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const salesOrderRouter = createTRPCRouter({
  createSalesOrder: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        poNumber: z.nullable(z.string()),
        piNumber: z.nullable(z.string()),
        currency: z.nullable(z.string()),
        orderValue: z.nullable(z.number()),
        city: z.nullable(z.string()),
        country: z.nullable(z.string()),
        dateReceived: z.nullable(z.date()),
        dueDate: z.nullable(z.date()),
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
              orderCustomFieldSchema: true,
              checkListSchema: true,
              users: true,
            },
          });
          let customFieldJson = undefined;
          if (current_org?.orderCustomFieldSchema) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            customFieldJson = Object.keys(
              current_org?.orderCustomFieldSchema
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
          const salesOrder = await ctx.prisma.salesOrder.create({
            data: {
              customerId: input.customerId,
              dateReceived: input.dateReceived,
              poNumber: input.poNumber,
              piNumber: input.piNumber,
              currency: input.currency,
              orderValue: input.orderValue,
              dueDate: input.dueDate,
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
          const notifications_to_create = current_org?.users
            .map((usr) => {
              return {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                message:
                  "New Sales Order Received " +
                  (current_customer?.companyName
                    ? "from " + current_customer?.companyName
                    : ""),
                purpose: NotificationPurpose.OrderCreated,
                userId: usr.id,
                organizationId: current_user.organizationId ?? "",
                salesOrderId: salesOrder.id,
              };
            })
            .filter((ntf) => ntf.userId !== ctx.session.user.id);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          await ctx.prisma.notification.createMany({
            data: notifications_to_create ?? [],
          });
          return salesOrder;
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to create sales order", error);
      }
    }),
  getSalesOrders: protectedProcedure.query(async ({ ctx }) => {
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
        return await ctx.prisma.salesOrder.findMany({
          orderBy: {
            dateReceived: "desc",
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
  getCustomerPortalSalesOrders: protectedProcedure.query(async ({ ctx }) => {
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
          return await ctx.prisma.salesOrder.findMany({
            select: {
              id: true,
              poNumber: true,
              dateReceived: true,
              orderValue: true,
              currency: true,
              organizationId: true,
              orderStatus: true,
            },
            where: {
              customerId: org.associatedCustomerId,
              visibleToCustomer: true,
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
  getTotalSalesOrderValue: protectedProcedure.query(async ({ ctx }) => {
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
        const orders = await ctx.prisma.salesOrder.findMany({
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
  updateSalesOrder: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        poNumber: z.nullable(z.string()),
        invoiceNumber: z.nullable(z.string()),
        dateReceived: z.nullable(z.date()),
        dueDate: z.nullable(z.date()),
        notes: z.nullable(z.string()),
        addressOne: z.nullable(z.string()),
        addressTwo: z.nullable(z.string()),
        addressZip: z.nullable(z.string()),
        addressState: z.nullable(z.string()),
        city: z.nullable(z.string()),
        country: z.nullable(z.string()),
        customFields: z.nullable(z.any()),
        checkListFields: z.nullable(z.any()),
        orderStatus: z.nullable(z.string()),
        paymentStatus: z.nullable(z.string()),
        priority: z.nativeEnum(OrderPriority),
        currency: z.nullable(z.string()),
        orderValue: z.nullable(z.number()),
        piNumber: z.nullable(z.string()),
        piDate: z.nullable(z.date()),
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
          return await ctx.prisma.salesOrder.update({
            where: {
              id: input.salesOrderId,
              organizationId: current_user.organizationId,
            },
            data: {
              dateReceived: input.dateReceived,
              poNumber: input.poNumber,
              invoiceNumber: input.invoiceNumber,
              dueDate: input.dueDate,
              notes: input.notes,
              addressOne: input.addressOne,
              addressTwo: input.addressTwo,
              addressState: input.addressState,
              addressZip: input.addressZip,
              city: input.city,
              country: input.country,
              orderStatus: input.orderStatus,
              paymentStatus: input.paymentStatus,
              priority: input.priority,
              updatedById: ctx.session.user.id,
              customFields: input.customFields,
              checkList: input.checkListFields,
              currency: input.currency,
              orderValue: input.orderValue,
              piNumber: input.piNumber,
              piDate: input.piDate,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update sales order", error);
      }
    }),
  updateSalesOrderCustomFields: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        customFields: z.nullable(z.any()),
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
          return await ctx.prisma.salesOrder.update({
            where: {
              id: input.salesOrderId,
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
        console.log("Failed to update salesOrder", error);
      }
    }),
  getSalesOrderCount: protectedProcedure.query(async ({ ctx }) => {
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
        const salesOrderCount = await ctx.prisma.salesOrder.count({
          where: {
            organizationId: current_user.organizationId,
            deleted: null,
          },
        });
        return salesOrderCount;
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
        select: {
          organizationId: true,
        },
      });
      if (current_user && current_user.organizationId) {
        const orders = await ctx.prisma.salesOrder.findMany({
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
      const currentUser = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      const currentSalesOrder = await ctx.prisma.salesOrder.findFirst({
        select: {
          customerId: true,
          dateReceived: true,
          poNumber: true,
          invoiceNumber: true,
          dueDate: true,
          notes: true,
          addressOne: true,
          addressTwo: true,
          addressZip: true,
          addressState: true,
          city: true,
          country: true,
          organizationId: true,
          customFields: true,
          visibleToCustomer: true,
          orderStatus: true,
          paymentStatus: true,
          priority: true,
          updatedAt: true,
          updatedById: true,
          createdAt: true,
          userId: true,
          checkList: true,
          currency: true,
          orderValue: true,
          createdFromRfqId: true,
          enablePublicShare: true,
          piNumber: true,
          piDate: true,
        },
        where: {
          id: input,
          deleted: null,
        },
      });
      if (
        currentUser &&
        currentSalesOrder &&
        currentUser.organizationId === currentSalesOrder.organizationId
      ) {
        return currentSalesOrder;
      } else {
        console.log("unauthorized user");
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOnePublic: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const currentSalesOrder = await ctx.prisma.salesOrder.findFirst({
          // Select required fields for the sales order
          select: {
            customerId: true,
            dateReceived: true,
            poNumber: true,
            invoiceNumber: true,
            dueDate: true,
            notes: true,
            addressOne: true,
            addressTwo: true,
            addressZip: true,
            addressState: true,
            city: true,
            country: true,
            organizationId: true,
            customFields: true,
            visibleToCustomer: true,
            orderStatus: true,
            paymentStatus: true,
            priority: true,
            updatedAt: true,
            updatedById: true,
            createdAt: true,
            userId: true,
            checkList: true,
            currency: true,
            orderValue: true,
            createdFromRfqId: true,
            enablePublicShare: true, // Include enablePublicShare field
            piNumber: true,
            piDate: true,
          },
          where: {
            id: input,
            deleted: null,
          },
        });
        if (currentSalesOrder && currentSalesOrder.enablePublicShare) {
          return currentSalesOrder;
        } else {
          console.log("Sales order not found or unauthorized user");
        }
      } catch (error) {
        console.log("Error fetching sales order", error);
      }
    }),
  getOneCustomerPortal: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const currentSalesOrder = await ctx.prisma.salesOrder.findFirst({
          select: {
            dateReceived: true,
            poNumber: true,
            dueDate: true,
            customFields: true,
            visibleToCustomer: true,
            updatedById: true,
            updatedAt: true,
            userId: true,
            orderStatus: true,
            paymentStatus: true,
          },
          where: {
            id: input,
            deleted: null,
            visibleToCustomer: true,
          },
        });
        return currentSalesOrder;
      } catch (error) {
        console.log("error", error);
      }
    }),
  getSalesOrderCustomerName: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        const currentCustomer = await ctx.prisma.salesOrder.findUnique({
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
          currentUser?.organizationId ===
          currentCustomer?.customer.organizationId
        ) {
          return currentCustomer?.customer.companyName;
        } else {
          return "";
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getSalesOrderPoNumber: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        const currentSalesOrder = await ctx.prisma.salesOrder.findUnique({
          where: {
            id: input,
            deleted: null,
          },
          select: {
            poNumber: true,
            organizationId: true,
          },
        });
        if (currentUser?.organizationId === currentSalesOrder?.organizationId) {
          return currentSalesOrder?.poNumber;
        } else {
          return "";
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateSalesOrderVisibility: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        visibility: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          if (currentUser.role == "ADMIN" || currentUser.role == "OWNER") {
            return await ctx.prisma.salesOrder.update({
              data: {
                visibleToCustomer: input.visibility,
              },
              where: {
                id: input.salesOrderId,
                organizationId: currentUser.organizationId,
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
  updatePublicShare: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        visibility: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          select: {
            organizationId: true,
            role: true,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId && currentUser.role) {
          if (currentUser.role == "ADMIN" || currentUser.role == "OWNER") {
            return await ctx.prisma.salesOrder.update({
              data: {
                enablePublicShare: input.visibility,
              },
              where: {
                id: input.salesOrderId,
                organizationId: currentUser.organizationId,
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
  deleteSalesOrder: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          if (currentUser.role == "ADMIN" || currentUser.role == "OWNER") {
            return await ctx.prisma.salesOrder.update({
              where: {
                id: input,
                organizationId: currentUser.organizationId,
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
        console.log("Failed to delete sales order", error);
      }
    }),
});
