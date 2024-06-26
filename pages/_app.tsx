import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider } from "next-auth/react";
import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import Layout from "../components/layout";
import FormProvider from "../context";
import DataProvider from "../context/data";
import { SelectedUserProvider } from "../context/SelectUserContext";
import { NotificationProvider } from '../context/NotificationContext';
import { PostProvider } from '../context/PostContext'; 

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('/api/socketServer');
    };

    socketInitializer();
  }, [router]);
  if (typeof window === "undefined") {
    global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
  }

  return (
    <SelectedUserProvider>
      <SessionProvider session={session}>
      <NotificationProvider>
        <ThemeProvider enableSystem={true} attribute="class">
          <DataProvider>
            <FormProvider>
            <PostProvider>

              <Layout>
                <Component {...pageProps} />
              </Layout>
              </PostProvider>
            </FormProvider>
          </DataProvider>
        </ThemeProvider>
        </NotificationProvider>
      </SessionProvider>
    </SelectedUserProvider>
  );
}

export default MyApp;