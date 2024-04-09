/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { type Prisma, type QuoteLineItem } from "@prisma/client";
import {
  Document,
  PDFDownloadLink,
  PDFViewer,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { toWords } from "number-to-words";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { createTw } from "react-pdf-tailwind";
import HeaderNav from "~/components/HeaderNav";
import QuoteNav from "~/components/QuoteNav";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/utils/api";

const tw = createTw({
  theme: {
    extend: {
      fontSize: {
        sm: ["8px"],
        base: ["9px"],
        lg: ["20px"],
        xl: ["24px"],
      },
      fontFamily: {
        "h-bold": ["Helvetica-Bold"],
        "h-italic": ["Helvetica-Oblique"],
      },
      colors: {
        primary: "#111827",
        secondary: "#6b7280",
        c: "#9ca3af",
      },
      width: {
        a4: "210mm",
      },
      height: {
        a4: "297mm",
      },
    },
  },
});

const QuoteHeader = () => {
  return (
    <View style={tw("flex items-center justify-center")}>
      <Text style={tw("text-base uppercase text-secondary my-2")}>Quote</Text>
    </View>
  );
};

type QuoteFooterProps = {
  orgName: string;
};

const QuoteFooter = ({ orgName }: QuoteFooterProps) => {
  const isKtex = useFeatureIsOn("is-ktex");
  return (
    <View
      style={tw(
        "mx-4 border-c h-44 border-b border-x flex flex-row items-end justify-between"
      )}
    >
      {isKtex && (
        <Text style={tw("text-sm w-3/4 p-4 text-secondary")}>
          We declare that this quote shows actual price of the goods described
          and that all particulars are true and correct.
        </Text>
      )}
      {isKtex && (
        <View
          style={tw(
            "border-c w-48 border-t border-l flex items-start justify-between"
          )}
        >
          <Text style={tw("text-base p-4 text-secondary")}>
            Signature and date
          </Text>
          <Text style={tw("text-base p-4 text-primary font-h-bold")}>
            {orgName}
          </Text>
        </View>
      )}
    </View>
  );
};

type OrganizationAddress =
  | {
      addressOne: string | null;
      addressTwo: string | null;
      addressCity: string | null;
      addressState: string | null;
      addressCountry: string | null;
      addressZip: string | null;
    }
  | null
  | undefined;

type QuoteDetailProps = {
  orgName: string;
  orgAddress?: OrganizationAddress;
  rfqNumber: string;
  dateReceived: string;
  customerName: string;
  customFields:
    | string
    | number
    | boolean
    | Prisma.JsonObject
    | Prisma.JsonArray;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function convertDate(date_str: string) {
  const temp_date = date_str.split("-");
  return temp_date[0];
}

const QuoteDetails = ({
  orgName,
  orgAddress,
  rfqNumber,
  dateReceived,
  customerName,
  customFields,
}: QuoteDetailProps) => {
  const todaysDateObject = new Date();
  const dateToday = convertDate(todaysDateObject.toDateString());
  const isKtex = useFeatureIsOn("is-ktex");
  return (
    <View style={tw("mx-4 flex flex-row border-x border-c border-t ")}>
      <View style={tw("w-full")}>
        <View style={tw("flex flex-col p-1")}>
          <Text style={tw("text-base text-secondary mb-2")}>
            {isKtex ? "Exporter" : "Seller"}
          </Text>
          <Text style={tw("text-base font-h-bold uppercase text-primary")}>
            {orgName}
          </Text>
          <Text style={tw("text-base")}>
            {orgAddress?.addressOne} {orgAddress?.addressTwo}
          </Text>
          <Text style={tw("text-base")}>
            {orgAddress?.addressCity}
            {orgAddress?.addressCity ? "," : ""} {orgAddress?.addressState}
          </Text>
          <Text style={tw("text-base ")}>{orgAddress?.addressCountry}</Text>
        </View>
        <View style={tw("flex flex-col border-c border-t p-1")}>
          <Text style={tw("text-base mb-2 text-secondary")}>
            {isKtex ? "Consignee / Buyer" : "Recipient"}
          </Text>
          <Text style={tw("text-base uppercase font-h-bold text-primary")}>
            {customerName}
          </Text>
          {/* <Text style={tw("text-base ")}>
            {companyAddress?.addressOne} {companyAddress?.addressTwo}
          </Text>
          <Text style={tw("text-base ")}>
            {companyAddress?.addressCity} {companyAddress?.addressState}
          </Text>
          <Text style={tw("text-base ")}>{companyAddress?.addressCountry}</Text> */}
        </View>
      </View>
      <View style={tw("w-full border-c border-l")}>
        <View style={tw("flex p-1")}>
          <Text style={tw("text-base mb-2 text-secondary")}>
            Quote No. and Date
          </Text>
          <View style={tw("flex flex-row gap-8")}>
            {rfqNumber && (
              <Text style={tw("text-base text-primary")}>{rfqNumber}</Text>
            )}
            <Text style={tw("text-base text-primary")}>{dateToday}</Text>
          </View>
        </View>
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any*/}
        {(customFields as any)?.["Payment Terms"] && (
          <View style={tw("flex flex-col border-c border-t p-1")}>
            <Text style={tw("mb-2 text-base text-secondary")}>
              Payment Terms
            </Text>
            <Text style={tw("w-3/4 text-base text-primary leading-relaxed")}>
              {(customFields as never)?.["Payment Terms"]}
            </Text>
          </View>
        )}
        {isKtex && (
          <View style={tw("flex flex-col border-t border-c p-1")}>
            {isKtex && (
              <Text style={tw("mb-2 text-base text-secondary")}>
                Container type
              </Text>
            )}
            {isKtex && (
              <Text style={tw("w-3/4 text-base text-primary leading-relaxed")}>
                40 foot HC
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

type quoteLineItemsType = QuoteLineItem[] | undefined;

type QuoteLineItemProps = {
  quoteLineItems: quoteLineItemsType;
  quoteCurrency: string;
};

const QuoteLineItems = ({
  quoteLineItems,
  quoteCurrency,
}: QuoteLineItemProps) => {
  function getLineTotal(
    partCost: Prisma.Decimal | null,
    partQuantity: Prisma.Decimal | null
  ): number {
    if (partCost && partQuantity) {
      return Number(partCost) * Number(partQuantity);
    } else if (partCost && !partQuantity) {
      return Number(partCost);
    } else {
      return 0;
    }
  }
  const InternationalFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const totalQuoteValue =
    quoteLineItems?.reduce(
      (acc, lineItem) =>
        acc + getLineTotal(lineItem.partCost, lineItem.partQuantity),
      0
    ) ?? 0;
  const totalQuoteValueInWords = String(toWords(totalQuoteValue));
  const totalDecimalValue = (totalQuoteValue.toFixed(2) + "").split(".")[1];
  const decimalValueInWords = String(toWords(totalDecimalValue ?? 0));
  const isKtex = useFeatureIsOn("is-ktex");
  return (
    <>
      <View style={tw("mx-4 flex flex-col border border-c")}>
        <View style={tw("flex flex-row border-c border-b justify-between")}>
          <Text style={tw("text-base px-4 py-2 text-secondary")}>Item</Text>
          <Text style={tw("text-base py-2 text-secondary")}>Description</Text>
          <View style={tw("flex flex-row justify-between")}>
            <View
              style={tw(
                "text-base border-c border-l px-2 py-2 w-[60px] text-secondary"
              )}
            >
              <Text>Quantity</Text>
              <Text style={tw("text-sm")}>{isKtex && "(SQ.YARDS)"}</Text>
            </View>
            <View
              style={tw(
                "text-base border-c border-l px-2 py-2 w-[60px] text-secondary"
              )}
            >
              <Text>Cost</Text>
              <Text style={tw("text-sm ")}>
                {isKtex && "(CIF USD / SO. YARD)"}
              </Text>
            </View>
            <View
              style={tw(
                "text-base border-c border-l px-2 py-2 w-[70px] text-secondary"
              )}
            >
              <Text>Amount</Text>
              <Text style={tw("text-sm ")}>{isKtex && "(CIF USD)"}</Text>
            </View>
          </View>
        </View>
        <View style={tw("flex flex-col")}>
          {quoteLineItems?.map((lineItem: QuoteLineItem) => (
            <View
              key={lineItem.id}
              style={tw("flex justify-between flex-row ")}
            >
              <View style={tw("py-4 ml-2 flex justify-between")}>
                <Text style={tw("text-base font-h-bold text-primary")}>
                  {lineItem.partName}
                </Text>
              </View>
              <View style={tw("py-4 flex justify-between")}>
                <Text style={tw("text-base text-primary w-[150px]")}>
                  {lineItem.partDetails}
                </Text>
              </View>
              <View style={tw("flex flex-row justify-between")}>
                <Text
                  style={tw(
                    "text-base border-c border-l py-4 px-2 w-[60px] text-primary"
                  )}
                >
                  {Number(lineItem.partQuantity)}
                </Text>
                <Text
                  style={tw(
                    "text-base border-c px-2 py-4 border-l w-[60px] text-primary"
                  )}
                >
                  {quoteCurrency === "USD"
                    ? InternationalFormat.format(Number(lineItem.partCost))
                    : quoteCurrency + " " + String(Number(lineItem.partCost))}
                </Text>
                <Text
                  style={tw(
                    "text-base border-c border-l px-2 py-4 w-[70px] text-primary"
                  )}
                >
                  {quoteCurrency === "USD"
                    ? InternationalFormat.format(
                        Number(
                          getLineTotal(
                            lineItem.partCost,
                            lineItem.partQuantity
                          ) ?? 0
                        )
                      )
                    : quoteCurrency +
                      " " +
                      String(
                        Number(
                          getLineTotal(
                            lineItem.partCost,
                            lineItem.partQuantity
                          ) ?? 0
                        ).toFixed(2)
                      )}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={tw("flex flex-row justify-between border-c border-x mx-4 ")}>
        <View style={tw("flex w-3/4")}>
          {isKtex && (
            <Text style={tw("text-sm p-1 text-secondary")}>
              Amount Chargeable
            </Text>
          )}
          {isKtex && (
            <Text
              style={tw("text-base font-h-italic uppercase p-1 text-primary ")}
            >
              {"USD "}
              {totalQuoteValueInWords}
              {" and "}
              {decimalValueInWords}
              {" cents only"}
            </Text>
          )}
        </View>
        <View style={tw("text-base border-l border-c border-b w-[70px]")}>
          <Text style={tw("text-base p-4")}>
            {quoteCurrency === "USD"
              ? InternationalFormat.format(totalQuoteValue)
              : quoteCurrency + " " + String(totalQuoteValue)}
          </Text>
        </View>
      </View>
    </>
  );
};

type DocumentProps = {
  QuoteDetailsProps: QuoteDetailProps;
  QuoteLineItemProps: QuoteLineItemProps;
  QuoteFooterProps: QuoteFooterProps;
};

const MyDoc = ({
  QuoteDetailsProps,
  QuoteLineItemProps,
  QuoteFooterProps,
}: DocumentProps) => {
  return (
    <>
      <Document>
        <Page size="A4">
          <QuoteHeader />
          <QuoteDetails
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            orgName={QuoteDetailsProps.orgName}
            orgAddress={QuoteDetailsProps.orgAddress}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            customerName={QuoteDetailsProps.customerName ?? ""}
            rfqNumber={QuoteDetailsProps.rfqNumber ?? ""}
            dateReceived={QuoteDetailsProps.dateReceived}
            customFields={QuoteDetailsProps.customFields ?? {}}
          />
          <QuoteLineItems
            quoteLineItems={QuoteLineItemProps.quoteLineItems}
            quoteCurrency={QuoteLineItemProps.quoteCurrency}
          />
          <QuoteFooter orgName={QuoteFooterProps.orgName ?? ""} />
        </Page>
      </Document>
    </>
  );
};

const QuotePage: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const posthog = usePostHog();
  const { uid } = router.query;
  const rfqUid = String(uid);
  const rawAddress = api.organization?.getOrganizationAddress.useQuery();
  const [orgAddress, setOrgAddress] = useState(rawAddress.data);
  const quoteLineItems = api.quote.getQuoteLineItems.useQuery({ id: rfqUid });
  const rfq = api.rfq.getOne.useQuery(rfqUid);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const orgName = api.organization.getOrgNameById.useQuery(
    rfq.data?.organizationId ?? ""
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const customerName = api.customer.getCustomerNameById.useQuery(
    rfq.data?.customerId ?? ""
  );
  // const customerAddress = `${rfq.data?.city ?? ""} ${rfq.data?.country ?? ""}`;
  // const customerAddress = api.customer?.getCompanyAddress.useQuery(
  //   rfq.data?.customerId ?? ""
  // );
  const rfqCustomFieldSchema =
    api.organization?.getCustomerPortalCustomSchema.useQuery();
  const [customFields, setCustomFields] = useState(rfq.data?.customFields);

  useEffect(() => {
    let newJson = undefined;
    if (rfqCustomFieldSchema.data?.rfqCustomFieldSchema) {
      newJson = Object.keys(
        rfqCustomFieldSchema.data?.rfqCustomFieldSchema
      ).reduce((obj: { [key: string]: string }, key) => {
        obj[key] = "";
        return obj;
      }, {});
    }
    setCustomFields(rfq.data?.customFields ?? newJson);
    setOrgAddress(rawAddress.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rfq.data?.customFields,
    rfq.isLoading,
    rfqCustomFieldSchema.data?.rfqCustomFieldSchema,
    rfqCustomFieldSchema.isLoading,
    rawAddress.isLoading,
  ]);
  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Generate PDF • Afterquote</title>
        </Head>
        <HeaderNav currentPage={"quotes"} />
        <main className="flex min-h-screen w-screen flex-row justify-center ">
          <div className="container max-w-7xl gap-12 ">
            <QuoteNav currentPage={"quote"} currentRfqId={rfqUid} />
            <div className="flex h-full flex-col items-center">
              <div className="my-2 flex w-full justify-between">
                <Button size="sm" variant="link" asChild>
                  <Link href={`/quote-items/${rfqUid}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to quote
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    posthog.capture("Quote Download PDF Clicked", {
                      createdBy: session
                        ? session.user.email
                        : "could not get email",
                    });
                  }}
                >
                  <PDFDownloadLink
                    document={
                      <MyDoc
                        QuoteDetailsProps={{
                          orgName: orgName.data ?? "",
                          orgAddress: orgAddress,
                          rfqNumber: rfq.data?.rfqNumber || "",
                          dateReceived: format(
                            rfq.data?.dateReceived ?? new Date(),
                            "P"
                          ),
                          customerName: customerName.data ?? "",
                          customFields: customFields ?? {},
                        }}
                        QuoteLineItemProps={{
                          quoteLineItems: quoteLineItems.data,
                          quoteCurrency: rfq.data?.currency ?? "USD",
                        }}
                        QuoteFooterProps={{
                          orgName: orgName.data ?? "",
                        }}
                      />
                    }
                    fileName={`quote-${rfqUid}.pdf`}
                  >
                    {({ loading }) =>
                      loading ? "Loading document..." : "Download PDF"
                    }
                  </PDFDownloadLink>
                </Button>
              </div>
              <PDFViewer className="h-full w-full">
                <MyDoc
                  QuoteDetailsProps={{
                    orgName: orgName.data ?? "",
                    orgAddress: orgAddress,
                    rfqNumber: rfq.data?.rfqNumber || "",
                    dateReceived: format(
                      rfq.data?.dateReceived ?? new Date(),
                      "P"
                    ),
                    customerName: customerName.data ?? "",
                    customFields: customFields ?? {},
                  }}
                  QuoteLineItemProps={{
                    quoteLineItems: quoteLineItems.data,
                    quoteCurrency: rfq.data?.currency ?? "USD",
                  }}
                  QuoteFooterProps={{
                    orgName: orgName.data ?? "",
                  }}
                />
              </PDFViewer>
            </div>
          </div>
        </main>
      </>
    );
  }
  return <Spinner />;
};
export default QuotePage;
