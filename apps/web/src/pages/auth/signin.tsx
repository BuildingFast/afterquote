import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getServerSession } from "next-auth/next";
import { getProviders, signIn } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { Button } from "~/components/ui/button";
import { authOptions } from "~/server/auth";

export default function SignIn({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const posthog = usePostHog();
  return (
    <>
      <Head>
        <title>Afterquote</title>
        <meta name="description" content="Sign into Afterquote" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="h-screen w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
        <div className="hidden bg-zinc-900 lg:block">
          <Image
            src="/signin-illustration.png"
            alt="Image"
            width="500"
            height="500"
            className="opacity-10 dark:brightness-[0.2] dark:grayscale"
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Login</h1>
              <p className="text-balance text-muted-foreground">
                Enter your details.
              </p>
            </div>
            <div className="grid gap-4">
              {Object.values(providers).map((provider) => (
                <Button
                  key={provider.name}
                  size="lg"
                  id={`signin-${provider.name}-web`}
                  className="w-full"
                  variant="outline"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={async () => {
                    await signIn(provider.id, { screen_hint: "signup" });
                    posthog.capture("Sign In on Web");
                  }}
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
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="underline">
                Sign up
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
