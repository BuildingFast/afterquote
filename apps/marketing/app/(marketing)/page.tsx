"use client"
import Image from "next/image"
import { getCalApi } from "@calcom/embed-react"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function IndexPage() {
  useEffect(() => {
    void (async function () {
      const cal = await getCalApi()
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      })
    })()
  }, [])
  return (
    <>
      <section className="relative space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-24">
        <div className="container flex flex-col gap-8 text-center sm:flex-row sm:gap-4">
          <div className="flex flex-col items-center gap-8 sm:items-start">
            <h1 className="bg-gradient-to-tl from-gray-600 to-black bg-clip-text font-heading text-3xl font-extrabold  text-transparent dark:from-gray-400 dark:to-white sm:text-start sm:text-3xl md:text-4xl lg:text-6xl">
              Simple order management for manufacturers
            </h1>
            <p className="max-w-[36rem] leading-normal text-muted-foreground sm:text-start sm:text-xl sm:leading-8">
              Afterquote helps you streamline all processes from inventory
              management to sales. Stop filling in spreadsheets manually and
              start scaling your business.
            </p>
            <div className="flex flex-row items-center justify-center space-y-4 sm:space-x-4">
              <Button
                data-cal-namespace=""
                data-cal-link="neilkanakia/quickchat"
                data-cal-config='{"layout":"month_view"}'
              >
                Get a demo
              </Button>
            </div>
          </div>
          <div>
            <Image
              className=""
              src={"/images/hero-illustration.png"}
              width={1000}
              height={1000}
              alt={""}
            />
          </div>
        </div>
        {/* <div className="container flex max-w-[80rem] flex-col items-center gap-4 text-center">
        </div> */}
      </section>
      {/*<section>
        <div className="relative flex items-center justify-center">
            {/* <iframe
              src="https://www.loom.com/embed/c735acd405f44aae9e939c3a3e9ec849?sid=a3b7eeaf-b81f-414e-8f94-86dcd92a9421"
          />*/}
      {/*<iframe
            className="aspect-video w-3/4"
            src="https://www.loom.com/embed/c735acd405f44aae9e939c3a3e9ec849?sid=a3b7eeaf-b81f-414e-8f94-86dcd92a9421"
            frameBorder="0"
          />
        </div>
      </section>*/}
      <section
        id="features"
        className="container space-y-6 bg-neutral-50 py-4 dark:bg-transparent md:py-6 lg:py-8"
      >
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-2xl leading-[1.1] sm:text-2xl md:text-5xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            {/* Software implementation can be labor-intensive and run the risk of never being completed.  */}
            We provide a dedicated launch team with a one-time fee to help your
            shop take off instead of leaving you stuck in the implementation
            forever.
          </p>
        </div>
        <div></div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-4">
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[240px] flex-col justify-between rounded-md p-6">
              <Image
                className="rounded-xl opacity-80 dark:invert"
                src={"/images/oc-time-flies.svg"}
                width={100}
                height={100}
                alt={""}
              />
              <div className="space-y-2">
                <h3 className="font-bold">Quote Faster </h3>
                <p className="text-md text-muted-foreground">
                  Create quotes and orders from your email with the help of AI.
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[240px] flex-col justify-between rounded-md p-6">
              <Image
                className="rounded-xl opacity-80 dark:invert"
                src={"/images/oc-handshake.svg"}
                width={100}
                height={100}
                alt={""}
              />
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Close deals faster</h3>
                <p className="text-md text-muted-foreground">
                  Track your sales pipeline and close deals faster.
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[300px] flex-col justify-between rounded-md p-6">
              <Image
                className="rounded-xl opacity-80 dark:invert"
                src={"/images/oc-project-development.svg"}
                width={100}
                height={100}
                alt={""}
              />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Customer Portal</h3>
                <p className="text-md text-muted-foreground">
                  Enable your customers to track orders and shipment statuses in
                  real time through a customer portal.
                </p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[240px] flex-col justify-between rounded-md p-6">
              <Image
                className="rounded-xl opacity-80 dark:invert"
                src={"/images/oc-taking-note.svg"}
                width={100}
                height={100}
                alt={""}
              />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  File Viewing and Storage
                </h3>
                <p className="text-md text-muted-foreground">
                  Store and view all your files in one place (including 3D
                  files)
                </p>
              </div>
            </div>
          </div>
          {/* <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[240px] flex-col justify-between rounded-md p-6">
              <Image
                className="rounded-xl  dark:invert"
                src={"/images/oc-handing-key.svg"}
                width={100}
                height={100}
                alt={""}
              />
              <div className="space-y-2">
                <h3 className="font-bold">Security</h3>
                <p className="text-sm text-muted-foreground">
                  We take security seriously. We use the latest encryption and
                  authentication.
                </p>
              </div>
            </div>
          </div> */}
          {/* <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[240px] flex-col justify-between rounded-md p-6">
              <div className="space-y-2">
                <Image
                  className="rounded-xl  dark:invert"
                  src={"/images/oc-puzzle.svg"}
                  width={100}
                  height={100}
                  alt={""}
                />
                <h3 className="font-bold">Integrations</h3>
                <p className="text-sm text-muted-foreground">
                  Integrate with the ERP and email systems you already use.
                </p>
              </div>
            </div>
          </div> */}
        </div>
        {/* <div className="mx-auto text-center md:max-w-[58rem]">
          <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Taxonomy also includes a blog and a full-featured documentation site
            built using Contentlayer and MDX.
          </p>
        </div> */}
      </section>
      <section
        id="attribution"
        className="container mt-2 space-y-6 rounded-lg py-8 dark:bg-transparent md:py-12 lg:py-12"
      >
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <p className="text-xl text-muted-foreground">Trusted by</p>
          <Image
            src={"./logo.svg"}
            width={150}
            height={150}
            className="dark:bg-transperant p-4"
            alt={""}
          />
        </div>
      </section>
      {/*<section id="open-source" className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Get started for free
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            No credit card required. Get started for free. No catch.
          </p>
        </div>
      </section>*/}
    </>
  )
}
