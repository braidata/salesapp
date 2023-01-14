import { useState, useEffect, useRef, useCallback } from "react";
import ProductTable from "../components/productTable";
import CopyButton from "../components/copyButton";
//import IFramer from "../components/iFramer";
import dynamic from "next/dynamic";

export default function PageWithJSbasedForm2() {
  // Handles the submit event on form submit. 
  // Sends the form data to the server and gets a response.
  let result;
  let refer;
  const Creator = dynamic(() => import("../components/creator"), {
    ssr: false,
  });
  const textAreaRef = useRef([]);
  const text = useCallback(() => {
    return textAreaRef.current;
  }, []);
  const [products, setProducts] = useState([]);
  const [alm, setAlm] = useState([]);
  const [texto, setTexto] = useState([]);

  useEffect(() => {
    setTexto(text);
  }, [text]);

  const handleSubmit = async (event) => {
    // Stop the form from submitting and refreshing the page.
    event.preventDefault();

    // Get data from the form.
    const data = {
      sku: event.target.sku.value,
      alm: event.target.alm.value,
    };

    // Send the data to the server in JSON format.
    const JSONdata = JSON.stringify(data);

    // API endpoint where we send form data.
    const endpoint = "/api/sqlConnectorProd";

    // Form the request for sending data to the server.
    const options = {
      // The method is POST because we are sending data.
      method: "POST",
      // Tell the server we're sending JSON.
      headers: {
        "Content-Type": "application/json",
      },
      // Body of the request is the JSON data we created above.
      body: JSONdata,
    };

    // Send the form data to our forms API on Vercel and get a response.
    const response = await fetch(endpoint, options);

    // Get the response data from server as JSON.
    // If server returns the name submitted, that means the form works.
    result = await response.json();
    //result = JSON.stringify(result);
    //console.log(result[0]);

    setProducts(result);
    setAlm(data.alm);
  };

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="sku"
          className="mt-2 mb-5 bg-blue-900/90 border border-gray-300 text-gray-900 text-sm rounded-lg hover:bg-blue-800/90 focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"

        >
          SKU
        </label>
        <input
          className="bg-gray-500 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="text"
          id="sku"
          name="sku"
          required
        />
        <label
          htmlFor="alm"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Almacén
        </label>
        <select
          id="alm"
          name="alm"
          required
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          <option defaultValue>Elige el almacén</option>
          <option value="021">021</option>
          <option value="001">001</option>
          <option value="009">009</option>
          <option value="030">030</option>
          <option value="024">024</option>
          <option value="018">018</option>
        </select>

        <button
          type="submit"
          className="mt-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          Buscar Producto
        </button>
      </form>

      {/* Table */}
      <div className="flex flex-col mt-5 mb-5">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            Almacén {alm ? alm : "Elige un almacén"}
            <div
              ref={textAreaRef}
              className="mb-2 mt-2 shadow overflow-hidden border-b border-gray-200 sm:rounded-lg"
            >
              {products.map((product) =>
                Object.entries(product).map(
                  (
                    [keyN, index] //<ProductTable   keyN={keyN} value={index} />
                  ) => (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-900">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-50 uppercase tracking-wider"
                          >
                            {keyN}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-800">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                  {index}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )
                )
              )}
            </div>
            {/* <CopyButton text={texto.textContent}/>
      {console.log(texto.textContent)} */}
          </div>
        </div>
      </div>
      {/* <IFramer
        url="https://calculadora-fedex.glitch.me"
        allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media;"
        width="100%"
        height="100%"
      /> */}
      {/* <Creator /> */}
    </div>
  );
}
