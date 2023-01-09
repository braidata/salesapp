import type { NextPage } from "next";
import Landing from "../components/landing";


const Home: NextPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Landing />
    </div>
  );
};

export default Home;
