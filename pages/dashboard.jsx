import Head from "next/head";
import Image from "next/image";
import OrderTable from "../components/orderTable";
import { useSession } from "next-auth/react";
import Text from "../components/text";
import { useState } from "react";

const Dashboard = () => {
  const {data: session} = useSession()
  const [data, setData] = useState();
  const userSender = async (event) => {
    //event.preventDefault();
    try {
      const data = {
        name: session.token.name,//contexts.owners.success[1] ,
        email: session.token.email,//contexts.owners.success[0],
        id: parseInt(session.token.sub)
      };
      const JSONdata = JSON.stringify(data);
      const endpoint = "/api/mysqlConsulta";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSONdata,
      };
      const response = await fetch(endpoint, options);
      const result = response;
      const resDB = await result.json();
      data = setData(resDB); 
      console.log("base", resDB);
    } catch {
      console.log("No hay datos DB");
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Text
        title="Dashboard"
        description="En esta sección podrás ver las ordenes que se han creado y las que se han entregado."
      />
      <button onClick={userSender}>Ver Data</button>
      <OrderTable data={data}/>
    </div>
  );
};

export default Dashboard;
