import Head from "next/head";
import HeaderNav, { type NavProps } from "./HeaderNav";

export interface LayoutProps extends NavProps {
  headerTitle?: string;
  children?: React.ReactNode;
}

export default function Layout({
  headerTitle,
  currentPage,
  children,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{headerTitle}</title>
      </Head>
      <div className="flex min-h-screen w-screen flex-col bg-muted/40">
        <HeaderNav currentPage={currentPage} />
        <main className="mt-8 gap-12 sm:container sm:mx-auto sm:max-w-screen-xl">
          {children}
        </main>
      </div>
    </>
  );
}
