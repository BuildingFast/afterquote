/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NotificationPurpose } from "@prisma/client";
import * as FileType from "file-type";
import { simpleParser } from "mailparser";
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";
import { prisma } from "~/server/db";
import { mime_dict } from "~/utils/extensionToMime";
// Create service client module using ES6 syntax.
import { S3Client } from "@aws-sdk/client-s3";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});
// Create a new ratelimiter, that allows 5 requests per 5 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, "5 s"),
});
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getAfterLastDot(str: string): string {
  const lastDotIndex = str.lastIndexOf(".");
  if (lastDotIndex === -1) {
    // No dot found in the string
    return "";
  }
  return str.substring(lastDotIndex + 1);
}

async function getFileExtension(buffer: Buffer): Promise<string | undefined> {
  const type = await FileType.fileTypeFromBuffer(buffer);

  if (!type) {
    throw new Error("Could not identify the file type.");
  }

  return type.ext;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const identifier = "emailApi";
  const rate_limit_checker = await ratelimit.limit(identifier);
  res.setHeader("X-RateLimit-Limit", rate_limit_checker.limit);
  res.setHeader("X-RateLimit-Remaining", rate_limit_checker.remaining);
  if (!rate_limit_checker.success) {
    res.status(200).json({
      message: "The request has been rate limited.",
      rateLimitState: rate_limit_checker,
    });
    return;
  }

  const email_raw = req.body.rawEmail;
  const mail_sender = req.body.emailFrom;
  if (typeof email_raw === "string" && typeof mail_sender === "string") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const parsedMail = await simpleParser(email_raw);

    // if (!parsedMail.from) {
    //   return res.status(404).json({ message: "Email Sender not found." });
    // }
    const current_user = await prisma.user.findFirst({
      where: {
        email: mail_sender,
      },
    });

    if (!current_user?.organizationId) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const current_org = await prisma.organization.findFirst({
      where: {
        id: current_user.organizationId,
      },
      select: {
        rfqCustomFieldSchema: true,
        users: true,
      },
    });

    let newJson: { [key: string]: any } = {};
    if (current_org?.rfqCustomFieldSchema) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      newJson = Object.keys(current_org?.rfqCustomFieldSchema).reduce(
        (obj: { [key: string]: string }, key) => {
          obj[key] = "";
          return obj;
        },
        {}
      );
    }

    newJson["company_name"] = "string";
    newJson["sender_email"] = "string";
    newJson["sender_name"] = "string";
    newJson["sender_position"] = "string";

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Based on the text, provide a JSON with the fields listed below with the value types corresponding to the types in the value fields in json_format. These values should be parsed based from the above email inquiry response from a potential customer to a manufacturer. If the value doesn't exist provide an empty string. The field format is ${JSON.stringify(
            newJson
          )}`,
        },
        { role: "user", content: parsedMail.text ?? "" },
      ],
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // if (typeof completion.data.choices[0]?.text !== "string") {
    //   return res
    //     .status(404)
    //     .json({ message: "Possible invalid openai response" });
    // }

    const company_info = JSON.parse(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      completion.choices[0]?.message?.content ?? "{}"
    );

    // check if a customer with the same name already exists
    // TODO - make this check based on name + email domain of customer
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        organizationId: current_user?.organizationId,
        companyName: company_info.company_name ?? "",
      },
    });

    const currentDate = new Date();

    if (existingCustomer) {
      const rfqCount = await prisma.rfq.count({
        where: {
          organizationId: current_user.organizationId,
        },
      });
      const rfqNumber = `${new Date().getFullYear()}-${(rfqCount + 1)
        .toString()
        .padStart(6, "0")}`;
      const rfx = await prisma.rfq.create({
        data: {
          customerId: existingCustomer.id,
          organizationId: current_user?.organizationId,
          userId: current_user?.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          notes: parsedMail.subject ?? JSON.stringify(parsedMail, null, 2),
          dateReceived: currentDate,
          rfqNumber: rfqNumber,
          customFields: newJson,
        },
      });

      const createdEmail = await prisma.email.create({
        data: {
          rfqId: rfx.id,
          emailSubject: parsedMail.subject ?? "",
          emailText: parsedMail.textAsHtml ?? "",
        },
      });

      const notifications_to_create = current_org?.users.map((usr) => {
        return {
          message:
            "New RFQ Received " +
            (company_info.company_name
              ? "from " + company_info.company_name
              : ""),
          purpose: NotificationPurpose.RfqCreated,
          userId: usr.id,
          organizationId: current_user.organizationId ?? "",
          rfqId: rfx.id,
        };
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await prisma.notification.createMany({
        data: notifications_to_create ?? [],
      });

      if (parsedMail.attachments.length > 0) {
        for (let i = 0; i < parsedMail.attachments.length; i++) {
          if (parsedMail.attachments[i]?.content) {
            const content = parsedMail.attachments[i]?.content;
            if (content === undefined) {
              return res.json({ message: "content undefined" });
            }
            //const fileExtension = await getFileExtension(content);
            const fileExtension = getAfterLastDot(
              parsedMail.attachments[i]?.filename ?? ""
            );
            // Generate file name to use in s3 bucket
            const mimeType: string = mime_dict[fileExtension ?? ""] ?? "";
            const bucketParams: { Bucket: string; Key: string } = {
              Bucket: "rfq-files",
              Key:
                fileExtension != ""
                  ? `rfq-files-${rfx.id}-${Math.ceil(
                      Math.random() * 10 ** 10
                    )}.${fileExtension}`
                  : `rfq-files-${rfx.id}-${Math.ceil(
                      Math.random() * 10 ** 10
                    )}`,
            };
            const command = new PutObjectCommand(bucketParams);
            const signedUrl = await getSignedUrl(s3Client, command, {
              expiresIn: 3600,
            });
            const response = await fetch(signedUrl, {
              method: "PUT",
              body: parsedMail.attachments[i]?.content,
              headers: {
                //"Content-Type": parsedMail.attachments[i]?.contentType ?? "",
                "Content-Type":
                  parsedMail.attachments[i]?.contentType ??
                  "application/octet-stream",
              },
            });
            const addedFile = await prisma.quoteFile.create({
              data: {
                storageService: "s3",
                storageFileName: bucketParams.Key,
                humanFileName: parsedMail.attachments[i]?.filename ?? mimeType,
                s3Bucket: "rfq-files",
                rfqId: rfx.id,
                organizationId: current_user?.organizationId,
              },
            });
          }
        }
      }

      return res.json({ rfx });
    }

    const createdCustomer = await prisma.customer.create({
      data: {
        companyName: company_info.company_name ?? "",
        organizationId: current_user?.organizationId,
        userId: current_user?.id,
      },
    });

    const rfx = await prisma.rfq.create({
      data: {
        customerId: createdCustomer.id,
        organizationId: current_user?.organizationId,
        userId: current_user?.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        notes: parsedMail.subject ?? JSON.stringify(parsedMail, null, 2),
        dateReceived: currentDate,
        customFields: newJson,
      },
    });

    if (!rfx) {
      return res.json({ message: "Failed to create RFQ" });
    }

    const notifications_to_create = current_org?.users.map((usr) => {
      return {
        message:
          "New RFQ Received " +
          (company_info.company_name
            ? "from " + company_info.company_name
            : ""),
        purpose: NotificationPurpose.RfqCreated,
        userId: usr.id,
        organizationId: current_user.organizationId ?? "",
        rfqId: rfx.id,
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await prisma.notification.createMany({
      data: notifications_to_create ?? [],
    });

    const createdEmail = await prisma.email.create({
      data: {
        rfqId: rfx.id,
        emailSubject: parsedMail.subject ?? "",
        emailText: parsedMail.text ?? "",
      },
    });

    if (!rfx) {
      return res.json({ message: "Failed to create email in Email table" });
    }

    if (parsedMail.attachments.length > 0) {
      // return res.json({ message: "No attachments found" });

      for (let i = 0; i < parsedMail.attachments.length; i++) {
        if (parsedMail.attachments[i]?.content) {
          const content = parsedMail.attachments[i]?.content;
          if (content === undefined) {
            break;
          }
          const fileExtension = getAfterLastDot(
            parsedMail.attachments[i]?.filename ?? ""
          );
          // Generate file name to use in s3 bucket
          const bucketParams: { Bucket: string; Key: string } = {
            Bucket: "rfq-files",
            Key:
              fileExtension != ""
                ? `rfq-files-${rfx.id}-${Math.ceil(
                    Math.random() * 10 ** 10
                  )}.${fileExtension}`
                : `rfq-files-${rfx.id}-${Math.ceil(Math.random() * 10 ** 10)}`,
          };
          const command = new PutObjectCommand(bucketParams);
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          const response = await fetch(signedUrl, {
            method: "PUT",
            body: parsedMail.attachments[i]?.content,
            headers: {
              "Content-Type":
                parsedMail.attachments[i]?.contentType ??
                "application/octet-stream",
            },
          });
          const addedFile = await prisma.quoteFile.create({
            data: {
              storageService: "s3",
              storageFileName: bucketParams.Key,
              humanFileName:
                parsedMail.attachments[i]?.filename ??
                company_info.company_name + bucketParams.Key,
              s3Bucket: "rfq-files",
              rfqId: rfx.id,
              organizationId: current_user?.organizationId,
            },
          });
        }
      }
    }
    return res.json({ rfx, rateLimitState: rate_limit_checker });
  }

  return res.json({ message: "No email body found" });
}
