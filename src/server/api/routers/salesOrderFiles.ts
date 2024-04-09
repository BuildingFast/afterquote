/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type User } from "@prisma/client";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// Create service client module using ES6 syntax.
import { S3Client } from "@aws-sdk/client-s3";
// Set the AWS Region.
const REGION = "us-east-1";
// Create an Amazon S3 service client object.
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY ? process.env.S3_UPLOAD_KEY : "",
    secretAccessKey: process.env.S3_UPLOAD_SECRET
      ? process.env.S3_UPLOAD_SECRET
      : "",
  },
});

type s3UrlObject = {
  s3Url: string;
  s3FileKey: string | undefined;
  humanFileName: string | undefined;
  fileId: string | undefined;
  visibleToCustomer: boolean | undefined;
};
export const salesOrderFilesRouter = createTRPCRouter({
  getPresignedUrlForSalesOrderFile: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        fileExtension: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create a random name for the Amazon Simple Storage Service (Amazon S3) bucket and key
        const bucketParams: { Bucket: string; Key: string } = {
          Bucket: "sales-order-files",
          Key: `sales-order-files-${input.salesOrderId}-${Math.ceil(
            Math.random() * 10 ** 10
          )}.${input.fileExtension}`,
        };
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        const currentSalesOrder: { organizationId: string } | null =
          await ctx.prisma.salesOrder.findFirst({
            where: {
              id: input.salesOrderId,
            },
            select: {
              organizationId: true,
            },
          });
        if (!currentSalesOrder) {
          return null;
        }
        if (
          currentUser &&
          currentUser.organizationId !== currentSalesOrder.organizationId
        ) {
          return null;
        }
        if (currentUser && currentUser.organizationId) {
          const command = new PutObjectCommand(bucketParams);
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          console.log(`\Created signed url`);
          console.log(signedUrl);
          return { s3Url: signedUrl, fileKey: bucketParams.Key };
        }
      } catch (error) {
        console.log("Error getting presigned url", error);
      }
    }),
  putSalesOrderFileInDb: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        fileKey: z.string(),
        humanFileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
          },
        });
        const currentSalesOrder: { organizationId: string } | null =
          await ctx.prisma.salesOrder.findFirst({
            where: {
              id: input.salesOrderId,
            },
            select: {
              organizationId: true,
            },
          });
        if (
          currentUser &&
          currentSalesOrder &&
          currentUser.organizationId !== currentSalesOrder.organizationId
        ) {
          return null;
        }
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.salesOrderFile.create({
            data: {
              storageService: "s3",
              storageFileName: input.fileKey,
              humanFileName: input.humanFileName,
              s3Bucket: "sales-order-files",
              salesOrderId: input.salesOrderId,
              organizationId: currentUser?.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("Error adding s3 url to order db table", error);
      }
    }),
  getS3UrlForCustomerPortal: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const s3Files = await ctx.prisma.salesOrderFile.findMany({
          select: {
            storageService: true,
            storageFileName: true,
            s3Bucket: true,
            humanFileName: true,
            id: true,
            visibleToCustomer: true,
          },
          where: {
            salesOrderId: input.salesOrderId,
            visibleToCustomer: true,
            deletedAt: null,
          },
        });
        const s3Urls: s3UrlObject[] = [];
        for (let i = 0; i < s3Files.length; i++) {
          const command = new GetObjectCommand({
            Bucket: "sales-order-files",
            Key: s3Files[i]?.storageFileName,
          });
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          s3Urls.push({
            s3Url: signedUrl,
            s3FileKey: s3Files[i]?.storageFileName,
            humanFileName: s3Files[i]?.humanFileName,
            fileId: s3Files[i]?.id,
            visibleToCustomer: s3Files[i]?.visibleToCustomer,
          });
        }
        return s3Urls;
      } catch (error) {
        console.log("Error creating presigned URL", error);
      }
    }),
  getS3UrlsForCustomerPublicLink: publicProcedure
    .input(z.object({ salesOrderId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const salesOrder = await ctx.prisma.salesOrder.findFirst({
          select: {
            enablePublicShare: true,
          },
          where: {
            id: input.salesOrderId,
          },
        });
        if (!salesOrder || !salesOrder.enablePublicShare) {
          return [];
        }
        const s3Files = await ctx.prisma.salesOrderFile.findMany({
          select: {
            storageService: true,
            storageFileName: true,
            s3Bucket: true,
            humanFileName: true,
            id: true,
            visibleToCustomer: true,
          },
          where: {
            salesOrderId: input.salesOrderId,
            visibleToCustomer: true,
            deletedAt: null,
          },
        });
        const s3Urls = [];
        for (let i = 0; i < s3Files.length; i++) {
          const command = new GetObjectCommand({
            Bucket: "sales-order-files",
            Key: s3Files[i]?.storageFileName,
          });
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          s3Urls.push({
            s3Url: signedUrl,
            s3FileKey: s3Files[i]?.storageFileName,
            humanFileName: s3Files[i]?.humanFileName,
            fileId: s3Files[i]?.id,
            visibleToCustomer: s3Files[i]?.visibleToCustomer,
          });
        }
        return s3Urls;
      } catch (error) {
        console.log("Error creating presigned URL", error);
      }
    }),

  getS3UrlsForOrder: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
      })
    )
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
        if (!currentUser || !currentUser.organizationId) {
          return [];
        }
        const s3Files = await ctx.prisma.salesOrderFile.findMany({
          select: {
            storageService: true,
            storageFileName: true,
            s3Bucket: true,
            humanFileName: true,
            id: true,
            visibleToCustomer: true,
          },
          where: {
            salesOrderId: input.salesOrderId,
            organizationId: currentUser.organizationId,
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        const s3Urls: s3UrlObject[] = [];
        for (let i = 0; i < s3Files.length; i++) {
          const command = new GetObjectCommand({
            Bucket: "sales-order-files",
            Key: s3Files[i]?.storageFileName,
          });
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          s3Urls.push({
            s3Url: signedUrl,
            s3FileKey: s3Files[i]?.storageFileName,
            humanFileName: s3Files[i]?.humanFileName,
            fileId: s3Files[i]?.id,
            visibleToCustomer: s3Files[i]?.visibleToCustomer,
          });
        }
        return s3Urls;
      } catch (error) {
        console.log("Error creating presigned URL", error);
      }
    }),
  getFilesForSalesOrderWithoutS3Urls: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
      })
    )
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
        if (!currentUser || !currentUser.organizationId) {
          return [];
        }
        return await ctx.prisma.salesOrderFile.findMany({
          select: {
            storageService: true,
            storageFileName: true,
            humanFileName: true,
            id: true,
            visibleToCustomer: true,
          },
          where: {
            salesOrderId: input.salesOrderId,
            organizationId: currentUser.organizationId,
            deletedAt: null,
          },
        });
      } catch (error) {
        console.log("Error getting Order files", error);
      }
    }),
  getS3UrlForFile: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
      })
    )
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
        if (!currentUser || !currentUser.organizationId) {
          return null;
        }
        const s3File = await ctx.prisma.salesOrderFile.findFirst({
          select: {
            storageService: true,
            storageFileName: true,
            s3Bucket: true,
            humanFileName: true,
            id: true,
          },
          where: {
            id: input.fileId,
            organizationId: currentUser.organizationId,
            deletedAt: null,
          },
        });
        const command = new GetObjectCommand({
          Bucket: "sales-order-files",
          Key: s3File?.storageFileName,
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });
        return {
          s3Url: signedUrl,
          s3FileKey: s3File?.storageFileName,
          humanFileName: s3File?.humanFileName,
          fileId: s3File?.id,
        };
      } catch (error) {
        console.log("Error creating presigned URL", error);
      }
    }),
  updateFileVisibility: protectedProcedure
    .input(
      z.object({
        fileId: z.string(),
        visibility: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            role: true,
            organizationId: true,
          },
        });
        const currentSalesOrderFile: { organizationId: string } | null =
          await ctx.prisma.salesOrderFile.findFirst({
            where: {
              id: input.fileId,
            },
            select: {
              organizationId: true,
            },
          });
        if (
          currentUser &&
          currentSalesOrderFile &&
          currentUser.organizationId !== currentSalesOrderFile.organizationId
        ) {
          return null;
        }
        if (
          currentUser &&
          (currentUser.role == "ADMIN" || currentUser.role == "OWNER")
        ) {
          return await ctx.prisma.salesOrderFile.update({
            data: {
              visibleToCustomer: input.visibility,
            },
            where: {
              id: input.fileId,
            },
          });
        } else {
          console.log("User not authorized to update file visibility");
        }
      } catch (error) {
        console.log("Error updating file visibility", error);
      }
    }),
  deleteFile: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
          },
          select: {
            organizationId: true,
            role: true,
          },
        });
        const currentOrderFile: { organizationId: string } | null =
          await ctx.prisma.salesOrderFile.findFirst({
            where: {
              id: input,
            },
            select: {
              organizationId: true,
            },
          });
        if (
          currentUser &&
          currentOrderFile &&
          currentUser.organizationId !== currentOrderFile.organizationId
        ) {
          console.log("User not authorized to delete file 1");
          return null;
        }
        if (
          currentUser &&
          (currentUser.role == "ADMIN" || currentUser.role == "OWNER")
        ) {
          return await ctx.prisma.salesOrderFile.update({
            data: {
              deletedAt: new Date(),
            },
            where: {
              id: input,
            },
          });
        } else {
          console.log("User not authorized to delete file");
        }
      } catch (error) {
        console.log("Error deleting file", error);
      }
    }),
});
