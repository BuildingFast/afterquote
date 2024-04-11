/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type User } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const customerRouter = createTRPCRouter({
  createCustomer: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
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
          return await ctx.prisma.customer.create({
            data: {
              companyName: input.companyName,
              organizationId: current_user.organizationId,
              userId: ctx.session.user.id,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to create customer", error);
      }
    }),
  getCustomerIdByName: protectedProcedure.query(async ({ ctx, input }) => {
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
        return await ctx.prisma.organization.findFirst({
          where: {
            id: current_user.organizationId,
          },
          select: {
            associatedCustomerId: true,
          },
        });
      } else {
        console.log("Could not get customer id");
      }
    } catch (error) {
      console.log("Failed to get customer id", error);
    }
  }),
  getCustomers: protectedProcedure.query(async ({ ctx, input }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.customer.findMany({
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
  updateCustomer: protectedProcedure
    .input(
      z.object({
        customerId: z.nullable(z.string()),
        companyName: z.nullable(z.string()),
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
        if (
          current_user &&
          current_user.organizationId &&
          input.customerId &&
          input.companyName
        ) {
          return await ctx.prisma.customer.updateMany({
            where: {
              id: input.customerId,
              organizationId: current_user.organizationId,
            },
            data: {
              companyName: input.companyName,
              customFields: input.customFields,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update customer", error);
      }
    }),
  getCustomerCount: protectedProcedure.query(async ({ ctx, input }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        const customer_count = await ctx.prisma.customer.count({
          where: {
            organizationId: current_user.organizationId,
          },
        });
        return customer_count;
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
      const current_customer = await ctx.prisma.customer.findFirst({
        select: {
          companyName: true,
          contacts: {
            where: {
              deleted: null,
            },
          },
          createdAt: true,
          organizationId: true,
          customFields: true,
        },
        where: {
          id: input,
        },
      });
      if (
        current_user &&
        current_customer &&
        current_user.organizationId === current_customer.organizationId
      ) {
        return current_customer;
      } else {
        console.log("unauthorized user");
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getRfqsForCustomer: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        const rfqs = await ctx.prisma.rfq.findMany({
          // select: {
          //   id: true,
          //   dateReceived: true,
          //   createdAt: true,
          //   organizationId: true,
          // },
          orderBy: {
            dateReceived: "asc",
          },
          where: {
            customerId: input,
            organizationId: current_user?.organizationId ?? "",
            deleted: null,
          },
        });
        if (current_user) {
          return rfqs;
        } else {
          console.log("unauthorized user");
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getOrdersForCustomer: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        const orders = await ctx.prisma.salesOrder.findMany({
          orderBy: {
            dateReceived: "asc",
          },
          where: {
            customerId: input,
            organizationId: current_user?.organizationId ?? "",
            deleted: null,
          },
        });
        if (current_user) {
          return orders;
        } else {
          console.log("unauthorized user");
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getCustomerNameById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        const customer = await ctx.prisma.customer.findFirst({
          select: {
            companyName: true,
            organizationId: true,
          },
          where: {
            id: input,
          },
        });
        if (
          current_user &&
          customer &&
          current_user.organizationId === customer.organizationId
        ) {
          return customer.companyName;
        } else {
          console.log("unauthorized user");
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getCompanyAddresses: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId && input) {
          return await ctx.prisma.customer.findFirst({
            select: {
              companyAddresses: true,
            },
            where: {
              id: input,
              organizationId: current_user.organizationId,
            },
          });
        } else {
          console.log("unauthorized user");
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateCompanyName: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        companyName: z.string(),
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
          return await ctx.prisma.customer.update({
            where: {
              id: input.companyId,
              organizationId: current_user.organizationId,
            },
            data: {
              companyName: input.companyName,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update company address", error);
      }
    }),
  deleteCompanyAddresses: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.companyAddress.delete({
          where: {
            id: input,
          },
        });
      } catch (error) {
        console.log("error", error);
      }
    }),
  createCompanyAddress: protectedProcedure
    .input(
      z.object({
        customerId: z.nullable(z.string()),
        addressOne: z.nullable(z.string()),
        addressTwo: z.nullable(z.string()),
        addressZip: z.nullable(z.string()),
        addressCity: z.nullable(z.string()),
        addressState: z.nullable(z.string()),
        addressCountry: z.nullable(z.string()),
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
          return await ctx.prisma.companyAddress.create({
            data: {
              addressOne: input.addressOne,
              addressTwo: input.addressTwo,
              addressZip: input.addressZip,
              addressState: input.addressState,
              addressCity: input.addressCity,
              addressCountry: input.addressCountry,
              customerId: input.customerId,
            },
          });
        }
      } catch (error) {
        console.log("Failed to create customer address", error);
      }
    }),
  updateCompanyAddressOne: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        addressOne: z.string(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.companyId,
            },
            data: {
              addressOne: input.addressOne,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update company address", error);
      }
    }),
  updateCompanyAddressTwo: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        addressTwo: z.string(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.companyId,
            },
            data: {
              addressTwo: input.addressTwo,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update company address", error);
      }
    }),
  updateCompanyAddressCity: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        addressCity: z.string(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.companyId,
            },
            data: {
              addressCity: input.addressCity,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update company address", error);
      }
    }),
  updateCompanyAddressState: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        addressState: z.string(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.companyId,
            },
            data: {
              addressState: input.addressState,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update company address", error);
      }
    }),
  updateCompanyAddressZip: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        addressZip: z.string(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.companyId,
            },
            data: {
              addressZip: input.addressZip,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update company address", error);
      }
    }),
  updateCompanyAddressCountry: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        addressCountry: z.string(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.companyId,
            },
            data: {
              addressCountry: input.addressCountry,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update company address", error);
      }
    }),

  setBillingAddress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isBillingAddress: z.boolean(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.id,
            },
            data: {
              isBillingAddress: input.isBillingAddress,
            },
          });
        }
      } catch (error) {
        console.log("Failed to set billing address", error);
      }
    }),
  setShippingAddress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isShippingAddress: z.boolean(),
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
          return await ctx.prisma.companyAddress.update({
            where: {
              id: input.id,
            },
            data: {
              isShippingAddress: input.isShippingAddress,
            },
          });
        }
      } catch (error) {
        console.log("Failed to set shipping address", error);
      }
    }),
});
