import Head from "next/head";
import Image from "next/image";
import Login from "../components/login";

const Logins = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Login />
    </div>
  );
};

export default Logins;
