import { useFormData } from "../context";
import FormularioDatas from "../lib/formularioDatas";
import SuccessMessage from "../components/forms/succesMessage";

export default function FormCompleted() {
  const { data } = useFormData();
  return (
    <>
      <p className="mt-2 mb-4 text-2xl font-bold text-center text-gray-600 dark:text-gray-200"
      >Tu venta está lista para ser envíada a SAP</p>
      <div className="flex flex-col items-center justify-center w-full h-full p-4 mx-auto mt-10 bg-white rounded-lg shadow-md dark:bg-gray-800">

        <FormularioDatas context={data} componente={<SuccessMessage />} />

      </div>
    </>
  );
}

