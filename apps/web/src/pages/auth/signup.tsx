import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getServerSession } from "next-auth/next";
import { getProviders, signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { authOptions } from "~/server/auth";

export default function SignUp({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Signup Afterquote</title>
        <meta name="description" content="Sign up to Afterquote" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="md:hidden">
        <Image
          src="/examples/authentication-light.png"
          width={1280}
          height={843}
          alt="Authentication"
          className="block dark:hidden"
        />
        <Image
          src="/examples/authentication-dark.png"
          width={1280}
          height={843}
          alt="Authentication"
          className="hidden dark:block"
        />
      </div>
      <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-screen flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900">
            <Image
              src={"/signin-illustration.png"}
              width={500}
              height={500}
              alt={"art"}
              className="absolute items-center opacity-10"
            />
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-3xl font-bold ">Sign up for free</h1>
              <p className="text-balance text-muted-foreground">
                Enter your email below to create your account
              </p>
            </div>
            <div className="grid justify-center gap-4 ">
              {Object.values(providers).map((provider) => (
                <Button
                  key={provider.name}
                  size="lg"
                  id={`signin-${provider.name}`}
                  className="w-72 shadow-sm sm:w-96"
                  variant="outline"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={() =>
                    signIn(
                      provider.id,
                      {
                        callbackUrl:
                          process.env.NEXT_PUBLIC_URL ||
                          "http://localhost:3000",
                      },
                      { screen_hint: "signup" }
                    )
                  }
                >
                  <Image
                    src={`/social/${provider.name}.svg`}
                    width={18}
                    height={18}
                    alt="social icon"
                    className="mr-2"
                  />
                  {provider.name === "Auth0" ? "Email" : provider.name}
                </Button>
              ))}
            </div>
            <div className="mt-4 text-center ">
              Already have an account?
              <Link href="/auth/signup" className="underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: "/" } };
  }

  const providers = await getProviders();

  return {
    props: { providers: providers ?? [] },
  };
}
