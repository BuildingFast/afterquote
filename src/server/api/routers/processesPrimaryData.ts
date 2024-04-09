/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const orgProcessesRouter = createTRPCRouter({
  createOrgProcess: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        machines: z.nullable(z.array(z.string())),
        materials: z.nullable(z.array(z.string())),
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
          const process = await ctx.prisma.processesCatalog.create({
            data: {
              name: input.name,
              organizationId: current_user.organizationId,
            },
          });
          if (input.machines) {
            const processMachines = input.machines?.map((machine) => {
              return {
                processId: process.id,
                machineId: machine,
              };
            });
            await ctx.prisma.processMachine.createMany({
              data: processMachines ?? [],
            });
          }
          if (input.materials) {
            const processMaterials = input.materials?.map((material) => {
              return {
                processId: process.id,
                materialId: material,
              };
            });
            await ctx.prisma.processMaterial.createMany({
              data: processMaterials ?? [],
            });
          }
          return process;
        } else {
          throw new Error(
            "Could not create process item: Organization ID missing"
          );
        }
      } catch (error) {
        console.error("Failed to create process item", error);
        throw new Error("Failed to create process item");
      }
    }),
  getProcess: protectedProcedure
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
          return await ctx.prisma.processesCatalog.findFirst({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
            select: {
              id: true,
              name: true,
              processMachines: {
                select: {
                  machine: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              processMaterials: {
                select: {
                  material: {
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
          return null;
        }
      } catch (error) {
        console.error("Error fetching process item", error);
        throw new Error("Failed to fetch process item");
      }
    }),
  getOrgProcesses: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
      });
      if (current_user && current_user.organizationId) {
        return await ctx.prisma.processesCatalog.findMany({
          where: {
            organizationId: current_user.organizationId,
            deleted: null,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            organizationId: true,
            name: true,
            processMachines: {
              select: {
                machine: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            processMaterials: {
              select: {
                material: {
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
        return [];
      }
    } catch (error) {
      console.error("Error fetching process items", error);
      throw new Error("Failed to fetch process items");
    }
  }),
  deleteProcessCatalogItem: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.processesCatalog.delete({
            where: {
              id: input,
              organizationId: currentUser.organizationId,
            },
          });
        }
      } catch (error) {
        console.error("Error deleting process item", error);
        throw new Error("Failed to delete process item");
      }
    }),
  updateProcess: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        machines: z.nullable(z.array(z.string())),
        materials: z.nullable(z.array(z.string())),
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
          const process = await ctx.prisma.processesCatalog.update({
            where: {
              id: input.id,
              organizationId: current_user.organizationId,
            },
            data: {
              name: input.name,
            },
            select: {
              id: true,
              processMachines: {
                select: {
                  machine: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
              processMaterials: {
                select: {
                  material: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          });
          if (input.machines) {
            const oldProcessMachines = process.processMachines.map(
              (pm) => pm.machine.id
            );
            const newProcessMachines = input.machines;
            const machinesToDelete = oldProcessMachines.filter(
              (oldMachine) => !newProcessMachines.includes(oldMachine)
            );
            const machinesToAdd = newProcessMachines.filter(
              (newMachine) => !oldProcessMachines.includes(newMachine)
            );
            await ctx.prisma.processMachine.deleteMany({
              where: {
                machineId: {
                  in: machinesToDelete,
                },
                processId: process.id,
              },
            });
            const processMachinesToAdd = machinesToAdd.map((machine) => {
              return {
                processId: process.id,
                machineId: machine,
              };
            });
            await ctx.prisma.processMachine.createMany({
              data: processMachinesToAdd ?? [],
            });
          }
          if (input.materials) {
            const oldProcessMaterials = process.processMaterials.map(
              (pm) => pm.material.id
            );
            const newProcessMaterials = input.materials;
            const materialsToDelete = oldProcessMaterials.filter(
              (oldMaterial) => !newProcessMaterials.includes(oldMaterial)
            );
            const materialsToAdd = newProcessMaterials.filter(
              (newMaterial) => !oldProcessMaterials.includes(newMaterial)
            );
            await ctx.prisma.processMaterial.deleteMany({
              where: {
                materialId: {
                  in: materialsToDelete,
                },
                processId: process.id,
              },
            });
            const processMaterialsToAdd = materialsToAdd.map((material) => {
              return {
                processId: process.id,
                materialId: material,
              };
            });
            await ctx.prisma.processMaterial.createMany({
              data: processMaterialsToAdd ?? [],
            });
          }
          return process;
        } else {
          throw new Error("Could not get organization id");
        }
      } catch (error) {
        console.error("Failed to update process", error);
        throw new Error("Failed to update process");
      }
    }),
  deleteProcessItem: protectedProcedure
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
            return await ctx.prisma.processesCatalog.update({
              where: {
                id: input,
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
