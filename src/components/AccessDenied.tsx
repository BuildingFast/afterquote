import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

export default function AccessDenied() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Image src="/access.svg" width={300} height={300} alt={"no access"} />
      <h1 className="text-2xl font-medium text-slate-800">
        You don&apos;t have access to settings. Please contact your
        administrator.
      </h1>
      <Link href="/quotes">
        <Button className="mt-8" size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </Link>
    </div>
  );
}
