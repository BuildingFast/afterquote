/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const orgMachinesRouter = createTRPCRouter({
  createOrgMachine: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        rate: z.nullable(z.number()),
        machineOperations: z.nullable(z.array(z.string())),
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
          const machine = await ctx.prisma.machineCatalog.create({
            data: {
              name: input.name,
              rate: input.rate,
              organizationId: current_user.organizationId,
            },
          });
          if (input.machineOperations) {
            const operationsOnMachines = input.machineOperations?.map(
              (machineOperation) => {
                return {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  machineId: machine.id,
                  operationId: machineOperation,
                };
              }
            );
            await ctx.prisma.operationsOnMachines.createMany({
              data: operationsOnMachines ?? [],
            });
          }
          return machine;
        } else {
          throw new Error(
            "Could not create machine item: Organization ID missing"
          );
        }
      } catch (error) {
        console.error("Failed to create machine item", error);
        throw new Error("Failed to create machine item");
      }
    }),
  getMachine: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const current_user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.machineCatalog.findFirst({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
            select: {
              id: true,
              name: true,
              rate: true,
              operations: {
                select: {
                  operation: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });
        } else {
          return null; // Return null or a default value if no machine item is found
        }
      } catch (error) {
        console.error("Error fetching machine item", error);
        throw new Error("Failed to fetch machine item");
      }
    }),

  getOrgMachines: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.machineCatalog.findMany({
          where: {
            organizationId: current_user.organizationId,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            organizationId: true,
            name: true,
            rate: true,
            operations: {
              select: {
                operation: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      } else {
        return []; // Return an empty array if no machine items are found
      }
    } catch (error) {
      console.error("Error fetching machine items", error);
      throw new Error("Failed to fetch machine items");
    }
  }),
  deleteMachineCatalogItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.machineCatalog.delete({
            where: {
              id: input,
              organizationId: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateMachine: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        rate: z.nullable(z.number()),
        machineOperations: z.nullable(z.array(z.string())),
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
          const machine = await ctx.prisma.machineCatalog.update({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
            data: {
              name: input.name,
              rate: input.rate,
            },
            select: {
              id: true,
              operations: {
                select: {
                  operation: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          });
          if (input.machineOperations) {
            const oldMachineOperations = machine.operations.map(
              (op) => op.operation.id
            );
            const newMachineOperations = input.machineOperations;
            const opsToDelete = oldMachineOperations.filter(
              (oldOp) => !newMachineOperations.includes(oldOp)
            );
            const opsToCreate = newMachineOperations.filter(
              (newOp) => !oldMachineOperations.includes(newOp)
            );
            await ctx.prisma.operationsOnMachines.deleteMany({
              where: {
                operationId: {
                  in: opsToDelete,
                },
                machineId: machine.id,
              },
            });
            const operationsOnMachines = opsToCreate.map((machineOperation) => {
              return {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                machineId: machine.id,
                operationId: machineOperation,
              };
            });
            await ctx.prisma.operationsOnMachines.createMany({
              data: operationsOnMachines ?? [],
            });
          }
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update machine", error);
      }
    }),
  deleteMachineItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.machineCatalog.delete({
            where: {
              id: input,
              organizationId: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("error", error);
      }
    }),
});
