import { useState, useEffect } from "react";
import ProductTable from "../components/productTable";
export default function PageWithJSbasedForm2() {
  // Handles the submit event on form submit.
  const [orders, setOrders] = useState([]);

  const handleSubmit = async (event) => {
    // Stop the form from submitting and refreshing the page.
    event.preventDefault();

    // Get data from the form.
    const data = {
      order: event.target.order.value,
    };

    // Send the data to the server in JSON format.
    const JSONdata = JSON.stringify(data);

    // API endpoint where we send form data.
    const endpoint = "/api/sqlConnector";

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
    let result = await response.json();
    //resultos = JSON.stringify(result);
    console.log(result);
    setOrders(result);
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="order">Order</label>
        <input
          className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="text"
          id="order"
          name="order"
          required
        />
        <button
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="submit"
        >
          Buscar Info
        </button>
      </form>

      {/* Table */}
      <div className="flex flex-row mt-5 mb-5">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              {orders.map((order) =>
                Object.entries(order).map(
                  ([keyO, index]) => (
                    console.log(keyO ),
                    (    //<ProductTable keyN={keyO} value={index} />
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-900">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th
                              scope="row"
                              className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-50 uppercase tracking-wider"
                            >
                              {keyO}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-800">
                          <tr>
                            <td  className="px-6 py-4 whitespace-nowrap">
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
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
