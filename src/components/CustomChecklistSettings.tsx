/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import AccessDenied from "./AccessDenied";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const CustomChecklistSettings: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const checklistSchema =
    api.organization?.getOrganizationChecklistSchema.useQuery();

  if (status === "unauthenticated") {
    void router.push("/");
  }
  if (status === "authenticated") {
    return (
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            View checklist items
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 h-96 overflow-x-auto rounded-md border-2 bg-slate-900 p-4 pr-12">
            <code className="text-slate-100">
              {checklistSchema.data &&
                checklistSchema.data.checkListSchema &&
                checklistSchema.data?.checkListSchema.map((item, index) => (
                  <h1 key={index}>{item}</h1>
                ))}
            </code>
          </pre>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  return <AccessDenied />;
};

export default CustomChecklistSettings;
