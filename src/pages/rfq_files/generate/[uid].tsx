import { Document, PDFViewer, Page, Text, View } from "@react-pdf/renderer";
import { ArrowLeft, Loader2 } from "lucide-react";
import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { createTw } from "react-pdf-tailwind";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

const tw = createTw({
  theme: {
    extend: {},
  },
});

type PdfProps = {
  customerName: string;
  rfqNumber: string;
  rfqId: string;
};

const MyPdf = ({ customerName }: PdfProps) => {
  return (
    <Document>
      <Page size="A4">
        <View style={tw("flex items-center justify-center")}>
          <Text style={tw("text-base uppercase ")}>Commercial Invoice</Text>
        </View>
        <View style={tw("mx-4 flex flex-row border-x border-t")}>
          <View style={tw("w-full ")}>
            <View style={tw("flex flex-col")}>
              <Text style={tw("text-sm")}>Exporter</Text>
              <Text style={tw("text-base font-bold uppercase")}>
                KT EXPORTS (INDIA) PVT.LTD.
              </Text>
              <Text style={tw("text-sm w-3/4")}>
                101, SUDAIV, PLOT NO. 97, HINDU COLONY, ROAD NO. 3, DADAR (E),
                MUMBAI 400 014, INDIA TEL:+91 22 2410 4500 * FAX:+91 22 2410
                5400 GST No.: 27AABCK5439R1ZV
              </Text>
            </View>
            <View style={tw("flex flex-col border-t")}>
              <Text style={tw("text-sm")}>Consignee/Buyer</Text>
              <Text style={tw("text-base uppercase font-bold")}>
                {customerName}
              </Text>
              {/* <Text style={{ fontFamily: 'bold font' }}>{customerName}</Text> */}
            </View>
          </View>
          <View style={tw("w-full border-l")}>
            <View style={tw("flex flex-col ")}>
              <Text style={tw("text-sm")}>Invoice# and Date</Text>
              <Text style={tw("text-sm")}>4207-208</Text>
              <Text style={tw("text-sm")}>04/08/2023</Text>
            </View>
            <View style={tw("flex flex-row border-t")}>
              <Text style={tw("text-sm")}>Buyer(if other than consignee)</Text>
            </View>
          </View>
        </View>
        <View style={tw("mx-4 flex flex-row border border-b-0 bg-red-200")}>
          <Text style={tw("text-base")}>Other info</Text>
        </View>
        <View style={tw("mx-4 flex flex-row border bg-blue-200")}>
          <Text style={tw("text-base")}>Description of Goods</Text>
        </View>
      </Page>
    </Document>
  );
};

const Generate: NextPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const customerCompanyName = api.rfq.getRfqCustomerName.useQuery(
    router.query.uid as string
  );

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <>
        <Head>
          <title>Generate PDF • Afterquote</title>
        </Head>
        <div className="flex h-screen w-screen flex-col items-center gap-2">
          <div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void router.push("/quotes")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          </div>
          <PDFViewer className="h-full w-full lg:h-5/6 lg:w-1/2">
            <MyPdf
              customerName={customerCompanyName.data ?? ""}
              rfqNumber={""}
              rfqId={""}
            />
          </PDFViewer>
        </div>
      </>
    );
  }
  return (
    <div className="m-72 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};
export default Generate;
