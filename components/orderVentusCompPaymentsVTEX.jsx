import { useState } from "react";

const VTEXStatusChangerForm = () => {
  const [orderId, setOrderId] = useState("");
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setResultData(null);

    try {
      const response = await fetch("/api/apiVTEXStatusChanger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          authorizationCode,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setResultData(data);
      } else {
        setErrorMessage(data.message || "Error en la actualización");
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center dark:text-gray-200">
        Actualizar Estado de Pedido VTEX
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div>
          <label className="block mb-1 font-medium dark:text-gray-300">
            ID del Pedido
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Ingrese el ID del Pedido"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium dark:text-gray-300">
            Código de Autorización
          </label>
          <input
            type="text"
            value={authorizationCode}
            onChange={(e) => setAuthorizationCode(e.target.value)}
            placeholder="Ingrese el Código de Autorización"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !orderId || !authorizationCode}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? "Procesando..." : "Actualizar Pedido"}
        </button>
      </form>

      {/* Card de éxito */}
      {resultData && (
        <div className="mt-6 p-4 border border-green-300 dark:border-green-700 rounded shadow-lg bg-green-100 dark:bg-green-700">
          <h2 className="text-xl font-bold mb-2 text-green-800 dark:text-green-200">
            Actualización Exitosa
          </h2>
          <p className="text-green-800 dark:text-green-100">
            {resultData.message}
          </p>
          <p className="mt-2 text-green-800 dark:text-green-100">
            <strong>Estado Final:</strong> {resultData.finalStatus}
          </p>
          <p className="text-green-800 dark:text-green-100">
            <strong>Código de Autorización:</strong> {authorizationCode}
          </p>
        </div>
      )}

      {/* Card de error */}
      {errorMessage && (
        <div className="mt-6 p-4 border border-red-300 dark:border-red-700 rounded shadow-lg bg-red-100 dark:bg-red-700">
          <h2 className="text-xl font-bold mb-2 text-red-800 dark:text-red-200">
            Error
          </h2>
          <p className="text-red-800 dark:text-red-100">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default VTEXStatusChangerForm;
