import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/styles.module.scss";
import FormCard from "../components/FormCard";
import {
  BillingInfo,
  BillingInfo2,
  ConfirmPurchase,
  PersonalInfo,
  ProductsInfo,
  ShippingInfo,
  PaymentsInfo,
} from "../components/forms";
import FormCompleted from "../components/FormCompleted";
import RefreshButton from "../components/refreshButton";
import UnformHubspot from "../components/forms/unformHubspot";
import { useSession } from "next-auth/react";

const App = () => {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      // The user is not authenticated, handle it here.
    },
  });

  const router = useRouter();
  const [formStep, setFormStep] = useState(0);

  const nextFormStep = () => setFormStep((currentStep) => currentStep + 1);

  const prevFormStep = () => setFormStep((currentStep) => currentStep - 1);

  const [refresh, setRefresh] = useState(false);
  const refreshPage = () => {
    setRefresh(true);
    router.reload();
  };
  if (status === "loading") {
    return (
      <div>
        <h1 className="mt-24 bg-gray-100   border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
          CREA TU VENTA
        </h1>
        <p className="mt-10 bg-gray-100 text-sm  border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
          Identificate con tu cuenta de Hubspot para acceder al Creador de
          Pedidos
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Creador de Pedidos</title>
      </Head>
      <h1 className="mt-10 bg-gray-100   border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
        CREA TU VENTA
      </h1>
      <UnformHubspot />
      {/* <AtomCounter /> */}
      <RefreshButton functions={refreshPage} />
      <FormCard currentStep={formStep} prevFormStep={prevFormStep}>
        {formStep >= 0 && (
          <PersonalInfo formStep={formStep} nextFormStep={nextFormStep} />
        )}
        {formStep >= 1 && (
          <BillingInfo formStep={formStep} nextFormStep={nextFormStep} />
        )}
        {formStep >= 2 && (
          <BillingInfo2 formStep={formStep} nextFormStep={nextFormStep} />
        )}
        {formStep >= 3 && (
          <ProductsInfo formStep={formStep} nextFormStep={nextFormStep} />
        )}
        {formStep >= 4 && (
          <ShippingInfo formStep={formStep} nextFormStep={nextFormStep} />
        )}
        {formStep >= 5 && (
          <PaymentsInfo formStep={formStep} nextFormStep={nextFormStep} />
        )}
        {formStep >= 6 && (
          <ConfirmPurchase formStep={formStep} nextFormStep={nextFormStep} />
        )}

        {formStep > 6 && <FormCompleted />}
      </FormCard>

      <div className="mt-10">
        {/* <BuscaHubspotD functions={refreshPage} /> */}
      </div>

      {/* <CardClosable children={<BuscaHubspotD functions={refreshPage} />} title="Buscador de Negocios" name="Busca por mail" description="Encuentra los datos de contacto, negocio y productos" /> */}
    </div>
  );
};

export default App;
