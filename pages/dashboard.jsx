import Head from "next/head";
import Image from "next/image";
import OrderTable from "../components/orderTable";

import Text from "../components/text";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Text
        title="Dashboard"
        description="En esta sección podrás ver las ordenes que se han creado y las que se han entregado."
      />
      <OrderTable />
    </div>
  );
};

export default Dashboard;
