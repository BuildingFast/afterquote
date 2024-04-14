/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const reportsRouter = createTRPCRouter({
  getRfqsByMonth: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          role: true,
          organizationId: true,
        },
      });
      if (
        current_user &&
        current_user.organizationId &&
        (current_user.role === "ADMIN" || current_user.role === "OWNER")
      ) {
        const result = await ctx.prisma.$queryRaw`SELECT
                DATE_TRUNC('month', "createdAt") AS month,
                COUNT(*) AS count
              FROM "Rfq"
              WHERE "createdAt" > NOW() - INTERVAL '1 year'
              AND "organizationId" = ${current_user.organizationId} -- Filtering by organization ID
              GROUP BY DATE_TRUNC('month', "createdAt")
              ORDER BY month ASC;`;
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const normalizedResult = (result as { month: any; count: any }[]).map(
          (row: { month: any; count: any }) => {
            // Create a new Date object
            const date = new Date(row.month);

            // Add one day
            date.setDate(date.getDate() + 1);
            const formattedMonth = `${monthNames[date.getMonth()]} ${String(
              date.getFullYear()
            ).slice(2)}`;

            return {
              month: formattedMonth, // Format the date as "Aug 23"
              count: Number(row.count), // Convert count from BigInt to Number
            };
          }
        );
        return normalizedResult;
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getRfqsByWeek: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          role: true,
          organizationId: true,
        },
      });
      if (
        current_user &&
        current_user.organizationId &&
        (current_user.role === "ADMIN" || current_user.role === "OWNER")
      ) {
        const result = await ctx.prisma.$queryRaw`SELECT
                DATE_TRUNC('week', "createdAt") AS week,
                COUNT(*) AS count
              FROM "Rfq"
              WHERE "createdAt" > NOW() - INTERVAL '30 days'
              AND "deleted" IS NULL
              AND "organizationId" = ${current_user.organizationId} -- Filtering by organization ID
              GROUP BY DATE_TRUNC('week', "createdAt")
              ORDER BY week ASC;`;
        const normalizedResult = (result as { week: any; count: any }[]).map(
          (row: { week: any; count: any }) => {
            const date = new Date(row.week);
            const firstDayOfWeek = date.getDate();
            const lastDayOfWeek = new Date(date);
            lastDayOfWeek.setDate(firstDayOfWeek + 6);

            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const formattedWeek = `${
              monthNames[date.getMonth()]
            } ${firstDayOfWeek} - ${
              monthNames[lastDayOfWeek.getMonth()]
            } ${lastDayOfWeek.getDate()}`;

            return {
              Week: formattedWeek,
              Rfqs: Number(row.count),
            };
          }
        );
        return normalizedResult;
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
  getRfqOrderValueByMonth: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          role: true,
          organizationId: true,
        },
      });
      if (
        current_user &&
        current_user.organizationId &&
        (current_user.role === "ADMIN" || current_user.role === "OWNER")
      ) {
        const result = await ctx.prisma.$queryRaw`SELECT
           DATE_TRUNC('month', "dateReceived") AS month,
           SUM("orderValue") as ordervalue
         FROM "Rfq"  
         WHERE "dateReceived" > NOW() - INTERVAL '1 year'
         AND "orderValue" IS NOT NULL
         AND "dateReceived" IS NOT NULL
         AND "organizationId" = ${current_user.organizationId} -- Filtering by organization ID
         GROUP BY DATE_TRUNC('month', "dateReceived")
         ORDER BY month ASC;`;
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const normalizedResult = (
          result as { month: any; ordervalue: number }[]
        ).map((row: { month: any; ordervalue: number }) => {
          const date = new Date(row.month);
          date.setDate(date.getDate() + 1);
          const formattedMonth = `${monthNames[date.getMonth()]} ${String(
            date.getFullYear()
          )}`;
          return {
            month: formattedMonth,
            orderValue: Number(row.ordervalue),
          };
        });

        return normalizedResult;
      }
    } catch (error) {
      console.error("Error", error);
    }
  }),
  getSalesOrderValueByMonth: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          role: true,
          organizationId: true,
        },
      });
      if (
        current_user &&
        current_user.organizationId &&
        (current_user.role === "ADMIN" || current_user.role === "OWNER")
      ) {
        const result = await ctx.prisma.$queryRaw`SELECT
           DATE_TRUNC('month', "dateReceived") AS month,
           SUM("orderValue") as ordervalue
         FROM "SalesOrder"  
         WHERE "dateReceived" > NOW() - INTERVAL '1 year'
         AND "orderValue" IS NOT NULL
         AND "dateReceived" IS NOT NULL
         AND "organizationId" = ${current_user.organizationId} -- Filtering by organization ID
         GROUP BY DATE_TRUNC('month', "dateReceived")
         ORDER BY month ASC;`;
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const normalizedResult = (
          result as { month: any; ordervalue: number }[]
        ).map((row: { month: any; ordervalue: number }) => {
          const date = new Date(row.month);
          date.setDate(date.getDate() + 1);
          const formattedMonth = `${monthNames[date.getMonth()]} ${String(
            date.getFullYear()
          )}`;
          return {
            month: formattedMonth,
            orderValue: Number(row.ordervalue),
          };
        });

        return normalizedResult;
      }
    } catch (error) {
      console.error("Error", error);
    }
  }),
  getOrdersByWeek: protectedProcedure.query(async ({ ctx }) => {
    try {
      const current_user = await ctx.prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          role: true,
          organizationId: true,
        },
      });
      if (
        current_user &&
        current_user.organizationId &&
        (current_user.role === "ADMIN" || current_user.role === "OWNER")
      ) {
        const result = await ctx.prisma.$queryRaw`SELECT
          DATE_TRUNC('week', "dateReceived") AS week,
          COUNT(*) AS count
        FROM "SalesOrder"
        WHERE "dateReceived" > NOW() - INTERVAL '30 days'
        AND "deleted" IS NULL
        AND "organizationId" = ${current_user.organizationId}
        GROUP BY DATE_TRUNC('week', "dateReceived")
        ORDER BY week ASC;`;

        const normalizedResult = (result as { week: any; count: any }[]).map(
          (row: { week: any; count: any }) => {
            const date = new Date(row.week);
            const firstDayOfWeek = date.getDate();
            const lastDayOfWeek = new Date(date);
            lastDayOfWeek.setDate(firstDayOfWeek + 6);

            const monthNames = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const formattedWeek = `${
              monthNames[date.getMonth()]
            } ${firstDayOfWeek} - ${
              monthNames[lastDayOfWeek.getMonth()]
            } ${lastDayOfWeek.getDate()}`;

            return {
              Week: formattedWeek,
              Orders: Number(row.count),
            };
          }
        );

        return normalizedResult;
      }
    } catch (error) {
      console.log("error", error);
    }
  }),
});
