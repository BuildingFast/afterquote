import Link from "next/link"

import { marketingConfig } from "@/config/marketing"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { SiteFooter } from "@/components/site-footer"
import Image from "next/image"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Image src={'/images/bg-pattern.png'} className="absolute w-full opacity-50" width={1024} height={1024} alt={'pattern'} />
      <header className="sticky top-0 z-40 backdrop-blur bg-opacity-10 ">
        <div className="z-10 container flex h-20 items-center justify-between py-6">
          <MainNav items={marketingConfig.mainNav} />
          <nav>
            <Link
              href="https://app.rfqtiger.com/"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "px-4"
              )}
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 z-10">
        {children}</main>
      <SiteFooter />
    </div>
  )
}
