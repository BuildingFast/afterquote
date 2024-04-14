/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type User, type Rfq } from "@prisma/client";
import * as trpc from "@trpc/server";
import { z } from "zod";
import formatComments from "~/utils/formatComments";
import { markdownToHtml } from "~/utils/markdownToHtml";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
export const commentsRouter = createTRPCRouter({
  createCommentForRfq: protectedProcedure
    .input(
      z.object({
        body: z.string().min(2, "Minimum comment length is 2"),
        rfqId: z.string(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user: { organizationId: string | null } | null =
          await ctx.prisma.user.findFirst({
            where: {
              id: ctx.session.user.id,
            },
            select: {
              organizationId: true,
            },
          });
        const current_rfq: { organizationId: string } | null =
          await ctx.prisma.rfq.findFirst({
            where: {
              id: input.rfqId,
            },
            select: {
              organizationId: true,
            },
          });
        if (current_user?.organizationId !== current_rfq?.organizationId) {
          return null;
        }
        if (current_user) {
          const comment = await ctx.prisma.comment.create({
            data: {
              body: input.body,
              rfq: {
                connect: {
                  id: input.rfqId,
                },
              },
              user: {
                connect: {
                  id: ctx.session?.user?.id,
                },
              },
              organization: {
                connect: {
                  id: current_user?.organizationId
                    ? current_user?.organizationId
                    : undefined,
                },
              },
              ...(input.parentId && {
                parent: {
                  connect: {
                    id: input.parentId,
                  },
                },
              }),
            },
          });
          return comment;
        }
      } catch (e) {
        console.log(e);

        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    }),
  getCommentsForRfq: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const current_user: User | null = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
        });
        if (current_user && current_user.organizationId) {
          const comments = await ctx.prisma.comment.findMany({
            where: {
              rfq: {
                id: input.rfqId,
              },
              organizationId: current_user.organizationId,
            },
            include: {
              user: true,
              rfq: {
                select: {
                  userId: true,
                  customerId: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          const withFormattedBody = await Promise.all(
            comments.map(async (comment) => {
              const formattedBody = await markdownToHtml(comment?.body || "", {
                removeLinksAndImages: false,
                truncate: false,
                linkifyImages: true,
              });

              return {
                ...comment,
                body: formattedBody,
                // By also sending the markdown body, we avoid having to
                // parse html back to MD when needed.
                authorIsOP: comment?.rfq?.userId === comment?.userId,
              };
            })
          );

          type CommentType = (typeof withFormattedBody)[0];
          const withChildren = formatComments<CommentType>(withFormattedBody);

          return withChildren;
        }
      } catch (e) {
        console.log(e);

        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    }),
  createCommentForSalesOrder: protectedProcedure
    .input(
      z.object({
        body: z.string().min(2, "Minimum comment length is 2"),
        salesOrderId: z.string(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const current_user: { organizationId: string | null } | null =
          await ctx.prisma.user.findFirst({
            where: {
              id: ctx.session.user.id,
            },
            select: {
              organizationId: true,
            },
          });
        const current_sales_order: { organizationId: string } | null =
          await ctx.prisma.salesOrder.findFirst({
            where: {
              id: input.salesOrderId,
            },
            select: {
              organizationId: true,
            },
          });
        if (
          current_user?.organizationId !== current_sales_order?.organizationId
        ) {
          return null;
        }
        if (current_user) {
          const comment = await ctx.prisma.comment.create({
            data: {
              body: input.body,
              salesOrder: {
                connect: {
                  id: input.salesOrderId,
                },
              },
              user: {
                connect: {
                  id: ctx.session?.user?.id,
                },
              },
              organization: {
                connect: {
                  id: current_user?.organizationId
                    ? current_user?.organizationId
                    : undefined,
                },
              },
              ...(input.parentId && {
                parent: {
                  connect: {
                    id: input.parentId,
                  },
                },
              }),
            },
          });
          return comment;
        }
      } catch (e) {
        console.log(e);

        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    }),
  getCommentsForSalesOrder: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
      })
    )
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
        const current_sales_order: { organizationId: string } | null =
          await ctx.prisma.salesOrder.findFirst({
            where: {
              id: input.salesOrderId,
            },
            select: {
              organizationId: true,
            },
          });
        if (
          current_user?.organizationId !== current_sales_order?.organizationId
        ) {
          return [];
        }
        if (current_user && current_user.organizationId) {
          const comments = await ctx.prisma.comment.findMany({
            where: {
              salesOrder: {
                id: input.salesOrderId,
              },
              organizationId: current_user.organizationId,
            },
            include: {
              user: true,
              salesOrder: {
                select: {
                  userId: true,
                  customerId: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          const withFormattedBody = await Promise.all(
            comments.map(async (comment) => {
              const formattedBody = await markdownToHtml(comment?.body || "", {
                removeLinksAndImages: false,
                truncate: false,
                linkifyImages: true,
              });

              return {
                ...comment,
                body: formattedBody,
                // By also sending the markdown body, we avoid having to
                // parse html back to MD when needed.
                authorIsOP: comment?.salesOrder?.userId === comment?.userId,
              };
            })
          );

          type CommentType = (typeof withFormattedBody)[0];
          const withChildren = formatComments<CommentType>(withFormattedBody);

          return withChildren;
        }
      } catch (e) {
        console.log(e);

        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    }),
  // updateComment: protectedProcedure
  //   .input(z.object({
  //       body: z.string().min(2, "Minimum comment length is 2"),
  //       commentId: z.string(),
  //   })).mutation(async ({ ctx, input }) => {
  //     if (isStringEmpty(input.body)) {
  //         throw new trpc.TRPCError({
  //           code: "BAD_REQUEST",
  //           message: "Comment cannot be empty",
  //         });
  //       }

  //     const current_user: User | null = await ctx.prisma.user.findFirst({
  //         where: {
  //           id: ctx.session.user.id,
  //         },
  //     })

  //     const previousComment = await ctx.prisma.comment.findFirst({
  //       where: {
  //         id: input.commentId,
  //       },
  //     });

  //     if (previousComment?.userId !== ctx.session.user.id || current_user?.organizationId !== previousComment?.organizationId) {
  //       throw new trpc.TRPCError({
  //         code: "UNAUTHORIZED",
  //         message: "You can only update comments created by you.",
  //       });
  //     }

  //       const comment = await ctx.prisma.comment.update({
  //         where: {
  //           id: input.commentId,
  //         },
  //         data: {
  //           ...(input.body && {
  //             body: input.body,
  //           }),
  //         },
  //       });

  //       return comment;
  //     }),
});
