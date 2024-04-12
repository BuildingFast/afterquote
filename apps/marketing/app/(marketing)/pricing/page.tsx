import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export const metadata = {
  title: "Pricing",
}

export default function PricingPage() {
  return (
    <section className="container flex flex-col  gap-6 py-8 md:max-w-[64rem] md:py-12 lg:py-24">
      <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[58rem]">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          Get started for free
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Get a demo of our complete set of premium features including for your company. Your access never expires.
        </p>
      </div>
      <div className="grid grid-rows-2 sm:grid-cols-2 gap-4">
      <div className="grid w-full items-start gap-10 rounded-lg border p-10 hover:shadow-md">
        <div className="grid gap-6">
          <h3 className="text-xl font-bold sm:text-2xl">
            Free
          </h3>
          <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> 50 RFQs
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> File uploads
            </li>

            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Up to 3 seats
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Audit log
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> 3 reports
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Help Center
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-4 text-center">
          <div>
            <h4 className="text-4xl font-bold">$0</h4>
            {/* <p className="text-sm font-medium text-muted-foreground">
              Billed Monthly
            </p> */}
          </div>
          <Link href="https://app.rfqtiger.com/" className={cn(buttonVariants({ size: "lg" }))}>
            Get Started
          </Link>
        </div>
      </div>
      <div className="bg-gradient-to-b from-blue-400 to-blue-600  grid w-full items-start gap-10 rounded-lg border p-10 hover:shadow-md hover:border-2">
        <div className="grid gap-6">
          <h3 className="text-xl font-bold sm:text-2xl text-white">
            Enterprise
          </h3>
          <ul className="grid gap-3 text-sm text-white sm:grid-cols-2">
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Unlimited RFQs
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Unlimited file uploads
            </li>

            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Real time collaboration
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Audit log
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Unlimited Advanced reports
            </li>
            <li className="flex items-center">
              <Icons.check className="mr-2 h-4 w-4" /> Premium Support
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-4 text-center">
          <Link href="https://heyform.net/f/UzE4rB9F" className={cn(buttonVariants({variant:"default", size: "lg" }), " bg-white text-primary hover:bg-white")}>
            Contact us
          </Link>
        </div>
      </div>
      </div>
      <div className="mx-auto flex w-full max-w-[58rem] flex-col gap-4">
        {/* <p className="max-w-[85%] leading-normal text-muted-foreground sm:leading-7">
          Taxonomy is a demo app.{" "}
          <strong>You can test the upgrade and won&apos;t be charged.</strong>
        </p> */}
      </div>
    </section>
  )
}
