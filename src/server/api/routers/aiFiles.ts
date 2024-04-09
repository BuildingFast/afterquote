/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  SetQueueAttributesCommand,
  DeleteQueueCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import {
  CreateTopicCommand,
  SubscribeCommand,
  DeleteTopicCommand,
} from "@aws-sdk/client-sns";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SNSClient } from "@aws-sdk/client-sns";
import {
  AnalyzeDocumentCommand,
  FeatureType,
  TextractClient,
  StartDocumentTextDetectionCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  GetDocumentTextDetectionCommand,
  DocumentMetadata,
} from "@aws-sdk/client-textract";
import axios from "axios";
//import * as PDFJS from "pdfjs-dist";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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

const textractClient = new TextractClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY ? process.env.S3_UPLOAD_KEY : "",
    secretAccessKey: process.env.S3_UPLOAD_SECRET
      ? process.env.S3_UPLOAD_SECRET
      : "",
  },
});

const sqsClient = new SQSClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY ? process.env.S3_UPLOAD_KEY : "",
    secretAccessKey: process.env.S3_UPLOAD_SECRET
      ? process.env.S3_UPLOAD_SECRET
      : "",
  },
});

const snsClient = new SNSClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_UPLOAD_KEY ? process.env.S3_UPLOAD_KEY : "",
    secretAccessKey: process.env.S3_UPLOAD_SECRET
      ? process.env.S3_UPLOAD_SECRET
      : "",
  },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type s3UrlObject = {
  s3Url: string;
  s3FileKey: string | undefined;
  humanFileName: string | undefined;
  fileId: string | undefined;
  visibleToCustomer: boolean | undefined;
};

export const aiFilesRouter = createTRPCRouter({
  setSalesOrderIdForAiFile: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        fileId: z.string(),
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
          return await ctx.prisma.salesOrderFile.updateMany({
            where: {
              storageFileName: input.fileId,
            },
            data: {
              salesOrderId: input.salesOrderId,
            },
          });
        } else {
          console.log("Could not get organization id");
        }
      } catch (error) {
        console.log("Failed to update file", error);
      }
    }),
  getPresignedUrlForAiFile: protectedProcedure
    .input(
      z.object({
        fileExtension: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create a random name for the Amazon Simple Storage Service (Amazon S3) bucket and key
        const bucketParams: { Bucket: string; Key: string } = {
          Bucket: "sales-order-files",
          Key: `sales-order-files-${uuidv4()}-${Math.ceil(
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
        if (currentUser && currentUser.organizationId) {
          const command = new PutObjectCommand(bucketParams);
          const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          return { s3Url: signedUrl, fileKey: bucketParams.Key };
        }
      } catch (error) {
        console.log("Error getting presigned url", error);
      }
    }),
  putSalesOrderFileInDb: protectedProcedure
    .input(
      z.object({
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
        if (currentUser && currentUser.organizationId) {
          return await ctx.prisma.salesOrderFile.create({
            data: {
              storageService: "s3",
              storageFileName: input.fileKey,
              humanFileName: input.humanFileName,
              s3Bucket: "sales-order-files",
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
        fileKey: z.string(),
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
            id: input.fileKey,
            organizationId: currentUser.organizationId,
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
          },
        });
      } catch (error) {
        console.log("Error getting Order files", error);
      }
    }),
  getS3UrlForFile: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
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
            storageFileName: input.fileName,
            organizationId: currentUser.organizationId,
          },
        });
        const command = new GetObjectCommand({
          Bucket: "sales-order-files",
          Key: s3File?.storageFileName,
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });
        const response = await axios.get(signedUrl, {
          responseType: "arraybuffer",
        });
        /*const arrayBuffer = response.data;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const pdf = PDFJS.getDocument(signedUrl).promise.then((pdfDoc) => {
          return pdfDoc;
        });*/
        const pdfLength = 1; //(await pdf).numPages;
        const roleArn = "arn:aws:iam::710994832738:role/TextractRole";
        const processType = "ANALYSIS";
        //const startJobId = "wow";
        const ts = Date.now();
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        const snsTopicName = "AmazonTextractExample" + ts;
        const snsTopicParams = { Name: snsTopicName };
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        const sqsQueueName = "AmazonTextractQueue-" + ts;
        // Set the parameters
        const sqsParams = {
          QueueName: sqsQueueName, //SQS_QUEUE_URL
          Attributes: {
            DelaySeconds: "60", // Number of seconds delay.
            MessageRetentionPeriod: "86400", // Number of seconds delay.
          },
        };

        const GetResults = async (processType: string, JobID: any) => {
          const maxResults = 1000;
          let paginationToken = null;
          let finished = false;
          const bigPdfTextArray: string[] = [];
          while (finished == false) {
            let response = null;
            if (processType == "ANALYSIS") {
              if (paginationToken == null) {
                response = await textractClient.send(
                  new GetDocumentAnalysisCommand({
                    JobId: JobID,
                    MaxResults: maxResults,
                  })
                );
                response.Blocks?.forEach((block) => {
                  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                  if (
                    "Text" in block &&
                    block.Text !== undefined &&
                    "BlockType" in block &&
                    block.BlockType === "LINE"
                  ) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    bigPdfTextArray.push(block.Text);
                  }
                });
              } else {
                response = await textractClient.send(
                  new GetDocumentAnalysisCommand({
                    JobId: JobID,
                    MaxResults: maxResults,
                    NextToken: paginationToken,
                  })
                );
                response.Blocks?.forEach((block) => {
                  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                  if (
                    "Text" in block &&
                    block.Text !== undefined &&
                    "BlockType" in block &&
                    block.BlockType === "LINE"
                  ) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    bigPdfTextArray.push(block.Text);
                  }
                });
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 5000));
            console.log("Detected Documented Text");
            console.log(response);
            //console.log(Object.keys(response))

            if (String(response).includes("NextToken")) {
              paginationToken = response?.NextToken;
            } else {
              finished = true;
            }
          }
          return bigPdfTextArray;
        };

        // Create the SNS topic and SQS Queue
        const createTopicandQueue = async () => {
          try {
            // Create SNS topic
            const topicResponse = await snsClient.send(
              new CreateTopicCommand(snsTopicParams)
            );
            const topicArn = topicResponse.TopicArn;
            console.log("Success", topicResponse);
            // Create SQS Queue
            const sqsResponse = await sqsClient.send(
              new CreateQueueCommand(sqsParams)
            );
            console.log("Success", sqsResponse);
            const sqsQueueCommand = await sqsClient.send(
              new GetQueueUrlCommand({ QueueName: sqsQueueName })
            );
            const sqsQueueUrl = sqsQueueCommand.QueueUrl;
            const attribsResponse = await sqsClient.send(
              new GetQueueAttributesCommand({
                QueueUrl: sqsQueueUrl,
                AttributeNames: ["QueueArn"],
              })
            );
            const attribs = attribsResponse.Attributes;
            console.log(attribs);
            const queueArn = attribs?.QueueArn;
            // subscribe SQS queue to SNS topic
            const subscribed = await snsClient.send(
              new SubscribeCommand({
                TopicArn: topicArn,
                Protocol: "sqs",
                Endpoint: queueArn,
              })
            );
            const policy = {
              Version: "2012-10-17",
              Statement: [
                {
                  Sid: "MyPolicy",
                  Effect: "Allow",
                  Principal: { AWS: "*" },
                  Action: "SQS:SendMessage",
                  Resource: queueArn,
                  Condition: {
                    ArnEquals: {
                      "aws:SourceArn": topicArn,
                    },
                  },
                },
              ],
            };

            const response = sqsClient.send(
              new SetQueueAttributesCommand({
                QueueUrl: sqsQueueUrl,
                Attributes: { Policy: JSON.stringify(policy) },
              })
            );
            console.log(response);
            console.log("Queue and topic arn here", sqsQueueUrl, topicArn);
            return [sqsQueueUrl, topicArn];
          } catch (err) {
            console.log("Error", err);
          }
        };

        const deleteTopicAndQueue = async (
          sqsQueueUrlArg: any,
          snsTopicArnArg: any
        ) => {
          const deleteQueue = await sqsClient.send(
            new DeleteQueueCommand({ QueueUrl: sqsQueueUrlArg })
          );
          const deleteTopic = await snsClient.send(
            new DeleteTopicCommand({ TopicArn: snsTopicArnArg })
          );
          console.log("Successfully deleted.");
        };

        const processDocumment = async (
          type: string,
          bucket: string,
          fileName: string,
          roleArn: string,
          sqsQueueUrl: string | undefined,
          snsTopicArn: string | undefined
        ) => {
          try {
            // Set job found and success status to false initially
            let jobFound = false;
            let succeeded = false;
            let dotLine = 0;
            const processType = type;
            let validType = false;
            let response;

            if (processType == "DETECTION") {
              response = await textractClient.send(
                new StartDocumentTextDetectionCommand({
                  DocumentLocation: {
                    S3Object: { Bucket: bucket, Name: fileName },
                  },
                  /*NotificationChannel: {
                    RoleArn: roleArn,
                    SNSTopicArn: snsTopicArn,
                  },*/
                })
              );
              console.log("Processing type: Detection");
              validType = true;
            }

            if (processType == "ANALYSIS") {
              console.log("Starting analysis yay");
              response = await textractClient.send(
                new StartDocumentAnalysisCommand({
                  DocumentLocation: {
                    S3Object: { Bucket: bucket, Name: fileName },
                  },
                  NotificationChannel: {
                    RoleArn: roleArn,
                    SNSTopicArn: snsTopicArn,
                  },
                  FeatureTypes: [FeatureType.TABLES, FeatureType.LAYOUT],
                })
              );
              console.log("Processing type: Analysis");
              validType = true;
            }

            if (validType == false) {
              console.log(
                "Invalid processing type. Choose Detection or Analysis."
              );
              return;
            }
            // while not found, continue to poll for response
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.log(`Start Job ID: ${response?.JobId}`);
            while (jobFound == false) {
              const sqsReceivedResponse = await sqsClient.send(
                new ReceiveMessageCommand({
                  QueueUrl: sqsQueueUrl,
                  MaxNumberOfMessages: 10,
                })
              );
              if (sqsReceivedResponse) {
                const responseString = JSON.stringify(sqsReceivedResponse);
                if (!responseString.includes("Body")) {
                  if (dotLine < 40) {
                    console.log(".");
                    console.log(responseString, sqsReceivedResponse);
                    dotLine = dotLine + 1;
                  } else {
                    console.log("");
                    dotLine = 0;
                  }
                  await new Promise((resolve) => setTimeout(resolve, 5000));
                  continue;
                }
              }

              // Once job found, log Job ID and return true if status is succeeded
              for (const message of sqsReceivedResponse.Messages ?? []) {
                console.log("Retrieved messages:");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const notification = JSON.parse(message?.Body ?? "");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const textMessage = JSON.parse(notification?.Message);
                const messageJobId = textMessage.JobId;
                console.log("textmessage", textMessage.JobId);
                console.log(response?.JobId);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                if (String(textMessage.JobId).includes(response?.JobId ?? "")) {
                  console.log("Matching job found:");
                  console.log(textMessage.JobId);
                  jobFound = true;
                  // GET RESUlTS FUNCTION HERE
                  const operationResults = await GetResults(
                    processType,
                    textMessage.JobId
                  );
                  //GET RESULTS FUMCTION HERE
                  console.log(textMessage.Status);
                  if (
                    String(textMessage.Status).includes(String("SUCCEEDED"))
                  ) {
                    succeeded = true;
                    console.log("Job processing succeeded.");
                    const sqsDeleteMessage = await sqsClient.send(
                      new DeleteMessageCommand({
                        QueueUrl: sqsQueueUrl,
                        ReceiptHandle: message.ReceiptHandle,
                      })
                    );
                    return operationResults;
                  }
                } else {
                  console.log("Provided Job ID did not match returned ID.");
                  const sqsDeleteMessage = await sqsClient.send(
                    new DeleteMessageCommand({
                      QueueUrl: sqsQueueUrl,
                      ReceiptHandle: message.ReceiptHandle,
                    })
                  );
                }
              }

              console.log("Done!");
            }
          } catch (err) {
            console.log("Error", err);
          }
        };
        if (pdfLength > 1) {
          /*const sqsAndTopic = await createTopicandQueue();
          if (!s3File?.storageFileName || !sqsAndTopic) {
            console.log("No storage file name found");
            return;
          }
          console.log("sqsAndTopic", sqsAndTopic);
          const finalListOfParsedPdf = await processDocumment(
            processType,
            "sales-order-files",
            s3File?.storageFileName,
            roleArn,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            sqsAndTopic[0],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            sqsAndTopic[1]
          );
          const deleteResults = await deleteTopicAndQueue(
            sqsAndTopic[0],
            sqsAndTopic[1]
          );
          return {
            s3Url: signedUrl,
            s3FileKey: s3File?.storageFileName,
            humanFileName: s3File?.humanFileName,
            fileId: s3File?.id,
            awsPdfArray: finalListOfParsedPdf ?? [],
          };*/
          return {
            s3Url: signedUrl,
            s3FileKey: s3File?.storageFileName,
            humanFileName: s3File?.humanFileName,
            fileId: s3File?.id,
            awsPdfArray: [],
          };
        } else {
          const params = {
            Document: {
              S3Object: {
                Bucket: "sales-order-files",
                Name: s3File?.storageFileName,
              },
            },
            FeatureTypes: [FeatureType.TABLES, FeatureType.LAYOUT],
          };
          const pdfTextArray: string[] = [];
          const analyze_document_text = async () => {
            try {
              const analyzeDoc = new AnalyzeDocumentCommand(params);
              const response = await textractClient.send(analyzeDoc);
              //console.log(response)
              //void displayBlockInfo(response);
              response.Blocks?.forEach((block) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                if (
                  "Text" in block &&
                  block.Text !== undefined &&
                  "BlockType" in block &&
                  block.BlockType === "LINE"
                ) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  pdfTextArray.push(block.Text);
                }
              });
              return pdfTextArray; // For unit tests.
            } catch (err) {
              console.log("Error", err);
            }
          };
          const awsPdfArray = await analyze_document_text();
          return {
            s3Url: signedUrl,
            s3FileKey: s3File?.storageFileName,
            humanFileName: s3File?.humanFileName,
            fileId: s3File?.id,
            awsPdfArray: awsPdfArray ?? [],
          };
        }
      } catch (error) {
        console.log("Error creating presigned URL", error);
      }
    }),
  getPdfArrayGptResponseForOrderFile: protectedProcedure
    .input(
      z.object({
        pdfArray: z.string(),
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
        const current_org = await ctx.prisma.organization.findFirst({
          where: {
            id: current_user?.organizationId,
          },
          select: {
            id: true,
            orderCustomFieldSchema: true,
          },
        });
        if (!current_org) {
          return;
        }
        let expectedGptResponseType: { [key: string]: any } = {};
        if (current_org?.orderCustomFieldSchema) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          expectedGptResponseType = Object.keys(
            current_org?.orderCustomFieldSchema
          ).reduce((obj: { [key: string]: string }, key) => {
            obj[key] = "";
            return obj;
          }, {});
        }
        expectedGptResponseType["consignee_buyer_name"] = "string";
        // TODO: Invoice number, Due Date, PO date received, PI date received, Custom PO
        expectedGptResponseType["invoice_number"] = "number";
        expectedGptResponseType["invoice_date"] = "date";
        expectedGptResponseType["purchase_order_date"] = "date";
        expectedGptResponseType["purchase_order_number"] = "number";
        expectedGptResponseType["order_items"] =
          "{name: string,description: string, quantity: number, price: number}[]";
        expectedGptResponseType["total_amount"] = "number";
        expectedGptResponseType["currency_code"] = "string";
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Based on the array of strings from a purchase order pdf, provide a JSON with the fields listed above with the value types corresponding to the types in the value fields in json_format. If the value doesn't exist provide an empty string. Return the dates in the format of the country code. The field format is: ${JSON.stringify(
                expectedGptResponseType
              )}`,
            },
            {
              role: "user",
              content: `${input.pdfArray} replacing this placeholder text with the actual content of the invoice.`,
            },
          ],
          temperature: 0,
          max_tokens: 4000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
        const company_info = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          completion.choices[0]?.message?.content ?? "{}"
        );
        // console.log("YAY WOW", company_info);
        return company_info;
      } catch (error) {
        console.log("Error updating file visibility", error);
      }
    }),
  bulkCreateSalesOrderItems: protectedProcedure
    .input(
      z.object({
        salesOrderId: z.string(),
        salesOrderItems: z.array(z.any()),
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
        const current_sales_order = await ctx.prisma.salesOrder.findFirst({
          where: {
            id: input.salesOrderId,
          },
          select: {
            organizationId: true,
          },
        });
        if (
          current_user &&
          current_sales_order &&
          current_user.organizationId !== current_sales_order.organizationId
        ) {
          return;
        }
        if (
          current_user &&
          current_sales_order &&
          current_user.organizationId
        ) {
          const orderItemsToCreate = input.salesOrderItems?.map(
            (salesOrderItem) => {
              return {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                partName: salesOrderItem.name,
                partDetails: salesOrderItem.description,
                partCost: Number(salesOrderItem.price),
                partQuantity: Number(salesOrderItem.quantity),
                organizationId: current_user.organizationId ?? "",
                userId: ctx.session.user.id,
                salesOrderId: input.salesOrderId,
              };
            }
          );
          return await ctx.prisma.orderLineItem.createMany({
            data: orderItemsToCreate ?? [],
          });
        }
      } catch (error) {
        console.log("Failed to update file", error);
      }
    }),
});
