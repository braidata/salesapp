import Navbar from "../components/blurNavbar";
import NewFooter from "../components/modernFooter";
import Head from "next/head";


const Layout = ({children }) => {

  
  return (
    <>
      <Head>
        <title>Ventus Sale ®</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar  />

      <div className="min-h-screen sm:mx-auto  flex lg:flex-row sm:max-w-full flex-col">
        <main className="flex-grow container sm:mx-auto px-2 sm:px-6">
          {children}
        </main>
      </div>
      <NewFooter />
    </>
  );
};

export default Layout;
