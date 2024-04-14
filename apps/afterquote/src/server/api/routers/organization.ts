import { type User } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
export const organizationRouter = createTRPCRouter({
  createOrganization: protectedProcedure
    .input(
      z.object({
        organization_name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.user
          .update({
            data: {
              role: "OWNER",
            },
            where: {
              id: ctx.session.user.id,
            },
          })
          .then(async () => {
            const current_org = ctx.prisma.organization.create({
              data: {
                name: input.organization_name,
              },
            });
            await ctx.prisma.user.update({
              data: {
                organizationId: (await current_org).id,
              },
              where: {
                id: ctx.session.user.id,
              },
            });
          })
          .catch((e: any) => {
            console.error("Failed to create org");
          });
      } catch (error) {
        console.log("error", error);
      }
    }),
  getOrganizationRfqFieldSchema: protectedProcedure.query(async ({ ctx }) => {
    try {
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
        return await ctx.prisma.organization.findFirst({
          select: {
            rfqCustomFieldSchema: true,
          },
          where: {
            id: currentUser.organizationId,
          },
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrganizationOrderFieldSchema: protectedProcedure.query(async ({ ctx }) => {
    try {
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
        return await ctx.prisma.organization.findFirst({
          select: {
            orderCustomFieldSchema: true,
          },
          where: {
            id: currentUser.organizationId,
          },
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrganizationOrderCustomFieldSchemaPublic: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const salesOrder = await ctx.prisma.salesOrder.findFirst({
          select: {
            organizationId: true,
          },
          where: {
            id: input,
          },
        });
        if (salesOrder && salesOrder.organizationId) {
          return await ctx.prisma.organization.findFirst({
            select: {
              orderCustomFieldSchema: true,
            },
            where: {
              id: salesOrder.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("Error fetching organization order field schema", error);
      }
    }),
  getOrganizationOrderStatusOptions: protectedProcedure.query(
    async ({ ctx }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          select: {
            organizationId: true,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.organization.findFirst({
            select: {
              orderStatusOptions: true,
            },
            where: {
              id: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getOrganizationContactsFieldSchema: protectedProcedure.query(
    async ({ ctx }) => {
      try {
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
          return await ctx.prisma.organization.findFirst({
            select: {
              contactsCustomFieldSchema: true,
            },
            where: {
              id: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getCustomerPortalCustomSchema: protectedProcedure.query(async ({ ctx }) => {
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
          const currentCustomer = await ctx.prisma.customer.findFirst({
            select: {
              id: true,
              organizationId: true,
            },
            where: {
              id: org.associatedCustomerId,
            },
          });
          if (currentCustomer && currentCustomer?.organizationId) {
            return await ctx.prisma.organization.findFirst({
              select: {
                rfqCustomFieldSchema: true,
              },
              where: {
                id: currentCustomer?.organizationId,
              },
            });
          } else {
            console.log("could not find organization");
          }
        } else {
          console.log("could not find customer");
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getCustomerPortalOrderCustomSchema: protectedProcedure.query(
    async ({ ctx }) => {
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
            const currentCustomer = await ctx.prisma.customer.findFirst({
              select: {
                id: true,
                organizationId: true,
              },
              where: {
                id: org.associatedCustomerId,
              },
            });
            if (currentCustomer && currentCustomer?.organizationId) {
              return await ctx.prisma.organization.findFirst({
                select: {
                  orderCustomFieldSchema: true,
                },
                where: {
                  id: currentCustomer?.organizationId,
                },
              });
            } else {
              console.log("could not find organization");
            }
          } else {
            console.log("could not find customer");
          }
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getOrganizationCompaniesFieldSchema: protectedProcedure.query(
    async ({ ctx }) => {
      try {
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
          return await ctx.prisma.organization.findFirst({
            select: {
              companiesCustomFieldSchema: true,
            },
            where: {
              id: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getOrganizationChecklistSchema: protectedProcedure.query(
    async ({ ctx, input }) => {
      try {
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
          return await ctx.prisma.organization.findFirst({
            select: {
              checkListSchema: true,
            },
            where: {
              id: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getOrganizationUsers: protectedProcedure.query(async ({ ctx, input }) => {
    try {
      const currentUser = await ctx.prisma.user.findFirst({
        select: {
          role: true,
          organizationId: true,
          organizationList: true,
        },
        where: {
          id: ctx.session.user.id,
        },
      });
      if (
        currentUser &&
        currentUser.organizationId &&
        (currentUser.role === "OWNER" || currentUser.role === "ADMIN")
      ) {
        return await ctx.prisma.user.findMany({
          select: {
            name: true,
            id: true,
            role: true,
            email: true,
          },
          where: {
            OR: [
              {
                organizationId: currentUser.organizationId,
              },
              { organizationList: { has: currentUser.organizationId } },
            ],
          },
        });
      } else {
        return [];
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrganizationCustomerPortalUsers: protectedProcedure.query(
    async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          select: {
            role: true,
            organizationId: true,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        if (!currentUser || !currentUser?.organizationId) {
          return;
        }
        const orgCustomersWithPortal = await ctx.prisma.customer.findFirst({
          select: {
            associatedCustomerOrg: true,
          },
          where: {
            organizationId: currentUser?.organizationId,
          },
        });
        if (!orgCustomersWithPortal) {
          return;
        }
        if (
          currentUser &&
          currentUser.organizationId &&
          (currentUser.role === "OWNER" || currentUser.role === "ADMIN")
        ) {
          return await ctx.prisma.user.findMany({
            select: {
              name: true,
              id: true,
              role: true,
              email: true,
              organization: true,
            },
            where: {
              organizationId: {
                in: orgCustomersWithPortal.associatedCustomerOrg.map(
                  (org) => org.id ?? ""
                ),
              },
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getOrganizationInvitations: protectedProcedure.query(
    async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          select: {
            role: true,
            organizationId: true,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        if (
          currentUser &&
          currentUser.organizationId &&
          (currentUser.role === "OWNER" || currentUser.role === "ADMIN")
        ) {
          return await ctx.prisma.invitation.findMany({
            select: {
              id: true,
              email: true,
              createdAt: true,
              status: true,
            },
            where: {
              organizationId: currentUser.organizationId,
              isCustomer: false,
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getCustomerPortalInvitations: protectedProcedure.query(
    async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          select: {
            role: true,
            organizationId: true,
          },
          where: {
            id: ctx.session.user.id,
          },
        });
        if (
          currentUser &&
          currentUser.organizationId &&
          (currentUser.role === "OWNER" || currentUser.role === "ADMIN")
        ) {
          return await ctx.prisma.invitation.findMany({
            select: {
              id: true,
              email: true,
              createdAt: true,
              status: true,
            },
            where: {
              organizationId: currentUser.organizationId,
              isCustomer: true,
            },
          });
        } else {
          return [];
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  ),
  getOrganizationName: protectedProcedure.query(async ({ ctx }) => {
    try {
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
        return await ctx.prisma.organization.findFirst({
          select: {
            name: true,
            id: true,
          },
          where: {
            id: currentUser.organizationId,
          },
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrganizationList: protectedProcedure.query(async ({ ctx }) => {
    try {
      const currentUser = await ctx.prisma.user.findFirst({
        select: {
          role: true,
          organizationId: true,
          organizationList: true,
        },
        where: {
          id: ctx.session.user.id,
        },
      });
      if (
        currentUser &&
        currentUser.organizationList &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        currentUser?.organizationList?.length < 2
      ) {
        return [];
      }
      if (
        currentUser &&
        currentUser.organizationId &&
        currentUser.organizationList
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const orgList = currentUser?.organizationList?.map(async (org) => {
          const currentOrg = await ctx.prisma?.organization?.findFirst({
            select: {
              name: true,
              id: true,
            },
            where: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              id: org,
            },
          });
          if (currentOrg && currentOrg.id && currentOrg.name) {
            return { id: currentOrg.id, name: currentOrg.name };
          }
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const finalAsyncOrgList = orgList.filter((o) => o !== undefined);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return await Promise.all(finalAsyncOrgList);
      }
      return [];
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrgNameById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const org = await ctx.prisma.organization.findFirst({
          select: {
            name: true,
          },
          where: {
            id: input,
          },
        });
        if (org) {
          return org.name;
        } else {
          console.log("could not find organization");
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  getOrganizationUserNames: protectedProcedure.query(async ({ ctx, input }) => {
    try {
      const currentUser = await ctx.prisma.user.findFirst({
        select: {
          organizationId: true,
        },
        where: {
          id: ctx.session.user.id,
        },
      });
      if (currentUser && currentUser.organizationId) {
        return await ctx.prisma.user.findMany({
          select: {
            name: true,
            id: true,
          },
          where: {
            organizationId: currentUser.organizationId,
          },
        });
      } else {
        return [];
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getCustomerPortalOrgName: protectedProcedure.query(async ({ ctx }) => {
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
          const currentCustomer = await ctx.prisma.customer.findFirst({
            select: {
              id: true,
              organizationId: true,
            },
            where: {
              id: org.associatedCustomerId,
            },
          });
          if (currentCustomer && currentCustomer?.organizationId) {
            return await ctx.prisma.organization.findFirst({
              select: {
                name: true,
              },
              where: {
                id: currentCustomer?.organizationId,
              },
            });
          } else {
            console.log("could not find organization");
          }
        } else {
          console.log("could not find customer");
        }
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrganizationCurrency: protectedProcedure.query(async ({ ctx }) => {
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
          select: {
            currency: true,
          },
          where: {
            id: current_user.organizationId,
          },
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrganizationFormWidgetId: protectedProcedure.query(async ({ ctx }) => {
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
          select: {
            formWidgetId: true,
          },
          where: {
            id: current_user.organizationId,
          },
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getOrganizationAddress: protectedProcedure.query(async ({ ctx }) => {
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
          select: {
            addressOne: true,
            addressTwo: true,
            addressCity: true,
            addressZip: true,
            addressState: true,
            addressCountry: true,
          },
          where: {
            id: current_user.organizationId,
          },
        });
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  updateOrganizationAddress: protectedProcedure
    .input(
      z.object({
        orgAddressOne: z.nullable(z.string()),
        orgAddressTwo: z.nullable(z.string()),
        orgAddressZip: z.nullable(z.string()),
        orgCity: z.nullable(z.string()),
        orgAddressState: z.nullable(z.string()),
        orgCountry: z.nullable(z.string()),
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
          return await ctx.prisma.organization.update({
            where: {
              id: current_user.organizationId,
            },
            data: {
              addressOne: input.orgAddressOne,
              addressTwo: input.orgAddressTwo,
              addressZip: input.orgAddressZip,
              addressState: input.orgAddressState,
              addressCity: input.orgCity,
              addressCountry: input.orgCountry,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update org address", error);
      }
    }),
  getOrganizationCurrencyFromId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.organization.findFirst({
          select: {
            currency: true,
          },
          where: {
            id: input.id,
          },
        });
      } catch (error) {
        console.log("error", error);
      }
    }),
  changeOrganizationCurrency: protectedProcedure
    .input(
      z.object({
        currency: z.string(),
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
          await ctx.prisma.organization.update({
            data: {
              currency: input.currency,
            },
            where: {
              id: current_user.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
});
