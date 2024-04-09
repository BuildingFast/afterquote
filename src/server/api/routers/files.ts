/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type User } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// Create service client module using ES6 syntax.
import { S3Client } from "@aws-sdk/client-s3";
import { file } from "jszip";
import { FileDiff } from "lucide-react";
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
  quoteLineItemName: string | undefined;
  quoteLineItemId: string | undefined;
};
export const filesRouter = createTRPCRouter({
  getPresignedUrlForRfqFile: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
        fileExtension: z.string(),
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
        if (
          current_user &&
          current_rfq &&
          current_user?.organizationId !== current_rfq?.organizationId
        ) {
          return null;
        }
        // Create a random name for the Amazon Simple Storage Service (Amazon S3) bucket and key
        const bucketParams: { Bucket: string; Key: string } = {
          Bucket: "rfq-files",
          Key: `rfq-files-${input.rfqId}-${Math.ceil(
            Math.random() * 10 ** 10
          )}.${input.fileExtension}`,
        };
        if (current_user && current_user.organizationId) {
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
  putRfqFileInDb: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
        fileKey: z.string(),
        humanFileName: z.string(),
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
        if (
          current_user &&
          current_rfq &&
          current_user?.organizationId !== current_rfq?.organizationId
        ) {
          return null;
        }
        if (current_user && current_user.organizationId) {
          return await ctx.prisma.quoteFile.create({
            data: {
              storageService: "s3",
              storageFileName: input.fileKey,
              humanFileName: input.humanFileName,
              s3Bucket: "rfq-files",
              rfqId: input.rfqId,
              organizationId: current_user?.organizationId,
            },
          });
        }
      } catch (error) {
        console.log("Error adding s3 url to rfq db table", error);
      }
    }),
  getS3UrlForCustomerPortal: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const s3Files = await ctx.prisma.quoteFile.findMany({
          select: {
            storageService: true,
            storageFileName: true,
            s3Bucket: true,
            humanFileName: true,
            id: true,
            visibleToCustomer: true,
          },
          where: {
            rfqId: input.rfqId,
            visibleToCustomer: true,
            deletedAt: null,
          },
        });
        const s3Urls: s3UrlObject[] = [];
        for (let i = 0; i < s3Files.length; i++) {
          const command = new GetObjectCommand({
            Bucket: "rfq-files",
            Key: s3Files[i]?.storageFileName,
          });
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          if (s3Files[i]?.visibleToCustomer) {
            s3Urls.push({
              s3Url: signedUrl,
              s3FileKey: s3Files[i]?.storageFileName,
              humanFileName: s3Files[i]?.humanFileName,
              fileId: s3Files[i]?.id,
              visibleToCustomer: s3Files[i]?.visibleToCustomer,
              quoteLineItemName: undefined,
              quoteLineItemId: undefined,
            });
          }
        }
        return s3Urls;
      } catch (error) {
        console.log("Error creating presigned URL", error);
      }
    }),
  getS3UrlsForRfq: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
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
        if (
          current_user &&
          current_rfq &&
          current_user?.organizationId !== current_rfq?.organizationId
        ) {
          return null;
        }
        const s3Files = await ctx.prisma.quoteFile.findMany({
          select: {
            storageService: true,
            storageFileName: true,
            s3Bucket: true,
            humanFileName: true,
            id: true,
            visibleToCustomer: true,
            quoteLineItem: {
              select: {
                partName: true,
                id: true,
              },
            },
          },
          where: {
            rfqId: input.rfqId,
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        const s3Urls: s3UrlObject[] = [];
        for (let i = 0; i < s3Files.length; i++) {
          const command = new GetObjectCommand({
            Bucket: "rfq-files",
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
            quoteLineItemName: s3Files[i]?.quoteLineItem?.partName,
            quoteLineItemId: s3Files[i]?.quoteLineItem?.id,
          });
        }
        return s3Urls;
      } catch (error) {
        console.log("Error creating presigned URL", error);
      }
    }),
  getFilesForRfqWithoutS3Urls: protectedProcedure
    .input(
      z.object({
        rfqId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
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
        if (
          current_user &&
          current_rfq &&
          current_user?.organizationId !== current_rfq?.organizationId
        ) {
          return null;
        }
        if (!current_user || !current_user.organizationId) {
          return;
        }
        return await ctx.prisma.quoteFile.findMany({
          select: {
            storageService: true,
            storageFileName: true,
            humanFileName: true,
            id: true,
            visibleToCustomer: true,
            quoteLineItem: true,
          },
          where: {
            deletedAt: null,
            rfqId: input.rfqId,
            organizationId: current_user?.organizationId,
          },
        });
      } catch (error) {
        console.log("Error getting RFQ files", error);
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
        const s3File = await ctx.prisma.quoteFile.findFirst({
          select: {
            storageService: true,
            storageFileName: true,
            s3Bucket: true,
            humanFileName: true,
            id: true,
          },
          where: {
            id: input.fileId,
            deletedAt: null,
          },
        });
        const command = new GetObjectCommand({
          Bucket: "rfq-files",
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
            organizationId: true,
            role: true,
          },
        });
        const currentRfqFile: { organizationId: string } | null =
          await ctx.prisma.quoteFile.findFirst({
            where: {
              id: input.fileId,
            },
            select: {
              organizationId: true,
            },
          });
        if (
          currentUser &&
          currentRfqFile &&
          currentUser.organizationId !== currentRfqFile.organizationId
        ) {
          return null;
        }
        if (
          currentUser &&
          (currentUser.role == "ADMIN" || currentUser.role == "OWNER")
        ) {
          return await ctx.prisma.quoteFile.update({
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
        const currentRfqFile: { organizationId: string } | null =
          await ctx.prisma.quoteFile.findFirst({
            where: {
              id: input,
            },
            select: {
              organizationId: true,
            },
          });
        if (
          currentUser &&
          currentRfqFile &&
          currentUser.organizationId !== currentRfqFile.organizationId
        ) {
          console.log("User not authorized to delete file 1");
          return null;
        }
        if (
          currentUser &&
          (currentUser.role == "ADMIN" || currentUser.role == "OWNER")
        ) {
          return await ctx.prisma.quoteFile.update({
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
