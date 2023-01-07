import { useFormData } from "../context";
import { useDataData } from "../context/data";
import FormularioDatas from "../lib/formularioDatas";
import SuccessMessage from "../components/forms/succesMessage";

export default function FormCompleted() {
  const { data } = useFormData();
  const { dataH } = useDataData();


  return (
    <>
      <h2 className="mt-2 mb-4 text-2xl font-bold text-center text-gray-600 dark:text-gray-200"
      >Tu venta fue envíada a SAP con éxito!</h2>
      <h3 className="mt-4 text-lg font-bold text-left text-gray-600 dark:text-gray-200" >Información del Pedido</h3>
      {/**Code TailwindCSS Block */}
      <div className="flex flex-col items-center justify-center w-full h-full p-4 mx-auto mt-10 bg-white rounded-lg shadow-md dark:bg-gray-800"> 
     {/* <code className=" p-4 mx-auto w-full mt-10 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <pre>{JSON.stringify(data, null, 1)}</pre>
      </code> */}

      <FormularioDatas context={data} componente={SuccessMessage} />
      
      </div>
      {/**Code TailwindCSS Block */}
      {/* <h3 className="mt-4 text-lg font-bold text-left text-gray-600 dark:text-gray-200" >Información del Cliente en HubSpot</h3> */}
      {/**Code TailwindCSS Block */}
      {/* <div className="flex flex-col items-center justify-center w-full h-full p-4 mx-auto mt-10 bg-white rounded-lg shadow-md dark:bg-gray-800"> 
     <code className="mr-96 -ml-20 max-w-0 mt-10 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <pre>{JSON.stringify(dataH, null, 1)}</pre>
      </code>
      </div> */}
     
    </>
  );
}

// import { useDataData } from "../context/data";
// <pre className="text-gray-900 dark:text-white-100">{JSON.stringify(dataH)}</pre>
// const { dataH } = useDataData();