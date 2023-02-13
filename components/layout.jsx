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

      <div className="min-h-screen -mx-8 sm:mx-auto  flex lg:flex-row sm:max-w-2xl flex-col">
        <main className="flex-grow container mx-8 sm:mx-auto px-2 sm:px-6">
          {children}
        </main>
      </div>
      <NewFooter />
    </>
  );
};

export default Layout;
