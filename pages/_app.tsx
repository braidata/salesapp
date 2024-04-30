import { SessionProvider } from "next-auth/react";
import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import Layout from "../components/layout";
import FormProvider from "../context";
import DataProvider from "../context/data";
import { SelectedUserProvider } from "../context/SelectUserContext";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  if (typeof window === "undefined") {
    global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
  }

  return (
    <SelectedUserProvider>
      <SessionProvider session={session}>
        <ThemeProvider enableSystem={true} attribute="class">
          <DataProvider>
            <FormProvider>

              <Layout>
                <Component {...pageProps} />
              </Layout>

            </FormProvider>
          </DataProvider>
        </ThemeProvider>
      </SessionProvider>
    </SelectedUserProvider>
  );
}

export default MyApp;