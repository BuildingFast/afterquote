/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  AreaChart,
  Card,
  Flex,
  Grid,
  Metric,
  Text,
  type DeltaType,
} from "@tremor/react";
import { Users } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import Layout from "~/components/Layout";
import {
  Card as UiCard,
  CardHeader,
  CardTitle,
  CardContent,
} from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";
import { getCurrencySymbol } from "~/utils/getCurrency";
import { useFeatureIsOn } from "@growthbook/growthbook-react";

const Reports: NextPage = () => {
  const { status } = useSession();
  const isKtex = useFeatureIsOn("is-ktex");
  const router = useRouter();
  const rfqCount = api.rfq?.getRfqCount.useQuery();
  const orderCount = api.salesOrder?.getSalesOrderCount.useQuery();
  const customerCount = api.customer?.getCustomerCount.useQuery();
  const totalRfqOrderValue = api.rfq?.getTotalOrderValue.useQuery();
  const rfqOrderValueByMonth = api.reports?.getRfqOrderValueByMonth.useQuery();
  const totalSalesOrderValue =
    api.salesOrder?.getTotalSalesOrderValue.useQuery();
  const salesOrderValueByMonth =
    api.reports?.getSalesOrderValueByMonth.useQuery();
  const orgCurrencyData = api.organization?.getOrganizationCurrency.useQuery();
  const [orgCurrency] = useState(
    orgCurrencyData.data?.currency
      ? String(orgCurrencyData.data?.currency)
      : "USD"
  );
  const rfqsByWeekForLast30Days = api.reports?.getRfqsByWeek.useQuery();
  const ordersByWeekForLast30Days = api.reports?.getOrdersByWeek.useQuery();
  const rfqCountLast30Days: {
    title: string;
    metric: string;
    metricPrev: string;
    deltaType: DeltaType;
  }[] = [
    {
      title: "Total Quotes",
      metric: String(rfqCount?.data) ?? "0",
      metricPrev: "$ 9,456",
      deltaType: "moderateIncrease",
    },
  ];
  const rfqOrderValues: {
    title: string;
    metric: string;
    metricPrev: string;
    deltaType: DeltaType;
  }[] = [
    {
      title: "Quote Order Values",
      metric: String(totalRfqOrderValue?.data) ?? "0",
      metricPrev: "$ 9,456",
      deltaType: "moderateIncrease",
    },
  ];
  const ordersCountLast30Days: {
    title: string;
    metric: string;
    metricPrev: string;
    deltaType: DeltaType;
  }[] = [
    {
      title: "Total Orders",
      metric: String(orderCount?.data) ?? "0",
      metricPrev: "$ 9,456",
      deltaType: "moderateIncrease",
    },
  ];
  const salesOrderValues: {
    title: string;
    metric: string;
    metricPrev: string;
    deltaType: DeltaType;
  }[] = [
    {
      title: "Sales Order Values",
      metric: String(totalSalesOrderValue?.data) ?? "0",
      metricPrev: "$ 9,456",
      deltaType: "moderateIncrease",
    },
  ];

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Layout headerTitle={"Analytics • Afterquote"} currentPage="reports">
        <div className="flex justify-center ">
          <Grid numItemsSm={2} numItemsLg={2} className="gap-6">
            {!isKtex &&
              rfqCountLast30Days.map((item) => (
                <Card key={item.title}>
                  <Flex alignItems="start">
                    <Text>{item.title}</Text>
                    {/*<BadgeDelta deltaType={item.deltaType}>{item.delta}</BadgeDelta>*/}
                  </Flex>
                  <Flex
                    className="space-x-3 truncate"
                    justifyContent="start"
                    alignItems="baseline"
                  >
                    <Metric>{item.metric}</Metric>
                    {/*<Text>from {item.metricPrev}</Text>*/}
                  </Flex>
                  <AreaChart
                    className="mt-6 h-28 w-96"
                    data={
                      rfqsByWeekForLast30Days.data
                        ? rfqsByWeekForLast30Days.data
                        : []
                    }
                    index="Week"
                    valueFormatter={(number: number) =>
                      `${Intl.NumberFormat("us").format(number).toString()}`
                    }
                    categories={["Rfqs"]}
                    colors={["blue"]}
                    showXAxis={true}
                    showGridLines={true}
                    startEndOnly={true}
                    showYAxis={false}
                    showLegend={false}
                  />
                </Card>
              ))}
            {!isKtex &&
              rfqOrderValues.map((item) => (
                <Card key={item.title}>
                  <Flex alignItems="start">
                    <Text>{item.title}</Text>
                  </Flex>
                  <Flex
                    className="space-x-3 truncate"
                    justifyContent="start"
                    alignItems="baseline"
                  >
                    {getCurrencySymbol(orgCurrency)}{" "}
                    <Metric>{item.metric}</Metric>
                  </Flex>
                  <AreaChart
                    className="mt-6 h-28 w-96"
                    data={
                      rfqOrderValueByMonth.data
                        ? rfqOrderValueByMonth.data.map((item) => ({
                            Month: item.month,
                            Value: item.orderValue,
                          }))
                        : []
                    }
                    index="Month"
                    valueFormatter={(number: number) =>
                      `${getCurrencySymbol(orgCurrency)} ${Intl.NumberFormat(
                        "us"
                      )
                        .format(number)
                        .toString()}`
                    }
                    categories={["Value"]}
                    colors={["green"]}
                    showXAxis={true}
                    showGridLines={true}
                    startEndOnly={true}
                    showYAxis={false}
                    showLegend={false}
                  />
                </Card>
              ))}
            {ordersCountLast30Days.map((item) => (
              <Card key={item.title}>
                <Flex alignItems="start">
                  <Text>{item.title}</Text>
                  {/*<BadgeDelta deltaType={item.deltaType}>{item.delta}</BadgeDelta>*/}
                </Flex>
                <Flex
                  className="space-x-3 truncate"
                  justifyContent="start"
                  alignItems="baseline"
                >
                  <Metric>{item.metric}</Metric>
                  {/*<Text>from {item.metricPrev}</Text>*/}
                </Flex>
                <AreaChart
                  className="mt-6 h-28 w-96"
                  data={
                    ordersByWeekForLast30Days.data
                      ? ordersByWeekForLast30Days.data
                      : []
                  }
                  index="Week"
                  valueFormatter={(number: number) =>
                    `${Intl.NumberFormat("us").format(number).toString()}`
                  }
                  categories={["Orders"]}
                  colors={["blue"]}
                  showXAxis={true}
                  showGridLines={true}
                  startEndOnly={true}
                  showYAxis={false}
                  showLegend={false}
                />
              </Card>
            ))}
            {salesOrderValues.map((item) => (
              <Card key={item.title}>
                <Flex alignItems="start">
                  <Text>{item.title}</Text>
                </Flex>
                <Flex
                  className="space-x-3 truncate"
                  justifyContent="start"
                  alignItems="baseline"
                >
                  {getCurrencySymbol(orgCurrency)}{" "}
                  <Metric>{item.metric}</Metric>
                </Flex>
                <AreaChart
                  className="mt-6 h-28 w-96"
                  data={
                    salesOrderValueByMonth.data
                      ? salesOrderValueByMonth.data.map((item) => ({
                          Month: item.month,
                          Value: item.orderValue,
                        }))
                      : []
                  }
                  index="Month"
                  valueFormatter={(number: number) =>
                    `${getCurrencySymbol(orgCurrency)} ${Intl.NumberFormat("us")
                      .format(number)
                      .toString()}`
                  }
                  categories={["Value"]}
                  colors={["green"]}
                  showXAxis={true}
                  showGridLines={true}
                  startEndOnly={true}
                  showYAxis={false}
                  showLegend={false}
                />
              </Card>
            ))}
            <UiCard className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Total Companies
                </CardTitle>
                <Users className="h-4 w-4 " />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {customerCount?.data ?? "-"}
                </div>
              </CardContent>
            </UiCard>
          </Grid>
        </div>
      </Layout>
    );
  }

  return <Spinner />;
};

export default Reports;
