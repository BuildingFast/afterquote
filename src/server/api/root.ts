import { createTRPCRouter } from "~/server/api/trpc";
import { exampleRouter } from "~/server/api/routers/example";
import { userRouter } from "~/server/api/routers/user";
import { organizationRouter } from "./routers/organization";
import { inviteRouter } from "./routers/invite";
import { rfqRouter } from "./routers/rfq";
import { commentsRouter } from "./routers/comments";
import { customerRouter } from "./routers/customers";
import { contactsRouter } from "./routers/contacts";
import { quoteRouter } from "./routers/quote";
import { filesRouter } from "./routers/files";
import { emailRouter } from "./routers/email";
import { websiteFormRouter } from "./routers/websiteForm";
import { notificationsRouter } from "./routers/notifications";
import { costingRouter } from "./routers/costing";
import { reportsRouter } from "./routers/reports";
import { taxRouter } from "./routers/taxes";
import { salesOrderRouter } from "./routers/salesOrder";
import { orderItemsRouter } from "./routers/orderItem";
import { salesOrderFilesRouter } from "./routers/salesOrderFiles";
import { orgOperationsRouter } from "./routers/operationsPrimaryData";
import { orgMachinesRouter } from "./routers/machinesPrimaryData";
import { orgMaterialsRouter } from "./routers/materialsPrimaryData";
import { orgProcessesRouter } from "./routers/processesPrimaryData";
import { rejectionFormRouter } from "./routers/rejectionForm";
import { aiFilesRouter } from "./routers/aiFiles";
import { catalogRouter } from "./routers/catalog";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  user: userRouter,
  organization: organizationRouter,
  invite: inviteRouter,
  rfq: rfqRouter,
  salesOrder: salesOrderRouter,
  comments: commentsRouter,
  customer: customerRouter,
  quote: quoteRouter,
  orderItems: orderItemsRouter,
  files: filesRouter,
  email: emailRouter,
  website_form: websiteFormRouter,
  notification: notificationsRouter,
  contact: contactsRouter,
  catalog: catalogRouter,
  costing: costingRouter,
  reports: reportsRouter,
  taxes: taxRouter,
  orderFiles: salesOrderFilesRouter,
  aiFiles: aiFilesRouter,
  operationsCatalog: orgOperationsRouter,
  machinesCatalog: orgMachinesRouter,
  materialsCatalog: orgMaterialsRouter,
  processCatalog: orgProcessesRouter,
  rejectionForm: rejectionFormRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
