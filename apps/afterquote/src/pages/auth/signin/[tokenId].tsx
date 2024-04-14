/* eslint-disable @typescript-eslint/restrict-plus-operands */
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getProviders, signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/server/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

export default function SignInWithInvite({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { tokenId } = router.query;
  return (
    <>
      <Head>
        <title>Afterquote</title>
        <meta name="description" content="Sign into Afterquote" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex max-h-screen flex-col justify-between">
        <div className="hidden items-center justify-center py-10 sm:flex">
          <Image src={"/paw.svg"} width={50} height={50} alt={""} />
        </div>
        <div className="static flex w-screen flex-col items-center justify-center sm:mt-40 sm:flex-row">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 ">
              Log in to your account. Please enter your details.
            </p>
            <Separator className="my-6 w-96 " />
            <div className="grid justify-center gap-4 ">
              {Object.values(providers).map((provider) => (
                <Button
                  key={provider.name}
                  size="lg"
                  id={`signin-${provider.name}`}
                  className="w-72 sm:w-96"
                  variant="outline"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/restrict-plus-operands
                  onClick={() =>
                    signIn(
                      provider.id,
                      {
                        callbackUrl:
                          process.env.NEXT_PUBLIC_URL +
                          "/accept_invite/" +
                          tokenId,
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
            <Separator className="my-6" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account yet?
              <Link
                className="dark:text-primary-500  text-blue-500 hover:underline"
                href="https://heyform.net/f/qpB9GKgy"
                passHref
              >
                {" "}
                Contact sales
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-10 items-center justify-center py-10 sm:flex">
          <Link
            className="text-sm text-blue-500"
            href={"https://rfqtiger.com/privacy"}
          >
            Privacy Policy
          </Link>
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
