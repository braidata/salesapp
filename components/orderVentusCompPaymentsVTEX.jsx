import { useState } from "react";

/**
 * Mapea el estado de VTEX a un estado en español.
 */
function mapVtexStatusToSpanish(status) {
  switch (status) {
    case "payment-pending":
    case "pending":
      return "Pendiente de pago";
    case "ready-for-handling":
      return "Listo para preparación";
    case "invoiced":
      return "Facturado";
    case "processing":
      return "Procesando";
    default:
      return "En espera";
  }
}

/**
 * Función que consulta el endpoint /api/apiVTEXPay para obtener la información
 * de la transacción y extraer el código de autorización.
 * Se asume que este endpoint devuelve un objeto con el campo authorizationCode.
 */
async function fetchAuthCodeFromPay(orderId) {
  try {
    const response = await fetch(`/api/apiVTEXPay?orderId=${orderId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Error al obtener la información de VTEXPay");
    }
    return data.authorizationCode || "N/A";
  } catch (error) {
    console.error("Error al obtener auth code desde VTEXPay:", error);
    return "N/A";
  }
}

const VTEXStatusChangerForm = () => {
  const [orderId, setOrderId] = useState("");
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [orderData, setOrderData] = useState(null); // Datos mapeados para la tabla
  const [vtexStatus, setVtexStatus] = useState("");   // Estado real de VTEX (para lógica condicional)
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null); // Respuesta de la actualización
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Realiza el fetch del pedido a VTEX por orderId y mapea los datos para la tabla.
   * Si el código de autorización no se encuentra en la respuesta principal,
   * se llama a fetchAuthCodeFromPay para intentar obtenerlo.
   */
  const fetchOrder = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setOrderData(null);
    setResultData(null);

    try {
      // Se consulta el endpoint que devuelve los detalles del pedido (sin el código de autorización)
      const response = await fetch(`/api/apiVTEX?orderId=${orderId}`);
      const data = await response.json();

      if (response.ok) {
        // Se extrae la información de pago
        const transaction = data.paymentData?.transactions?.[0];
        const payment = transaction?.payments?.[0];
        // Intentamos obtener el auth code desde connectorResponses (lo que se tiene en la respuesta principal)
        let authCodeFromTx = payment?.connectorResponses?.authorizationCode || "N/A";
        // Si es "N/A", se llama a fetchAuthCodeFromPay para obtenerlo desde VTEXPay
        if (authCodeFromTx === "N/A") {
          authCodeFromTx = await fetchAuthCodeFromPay(orderId);
        }

        // Mapeamos el estado a español
        const translatedStatus = mapVtexStatusToSpanish(data.status);

        // Construimos el objeto para la tabla
        const mappedData = {
          ID: data.orderId || "N/A",
          Estado: translatedStatus,
          Nombre:
            data.clientProfileData?.firstName && data.clientProfileData?.lastName
              ? `${data.clientProfileData.firstName} ${data.clientProfileData.lastName}`
              : "N/A",
          Rut: data.clientProfileData?.document || "N/A",
          "Rut de Empresa": data.clientProfileData?.corporateDocument || "N/A",
          // Dividimos por 100 sin decimales
          Total: data.value ? (data.value / 100).toFixed(0) : "0",
          "Método de Pago": payment?.paymentSystemName || "N/A",
          "Código de Autorización": authCodeFromTx
        };

        setOrderData(mappedData);
        setVtexStatus(data.status || "");
      } else {
        setErrorMessage(data.message || "Error al obtener el pedido");
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualiza el estado del pedido en VTEX mediante POST a /api/apiVTEXStatusChanger.
   * Tras la actualización, vuelve a consultar el pedido para reflejar cambios.
   */
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setResultData(null);

    try {
      const response = await fetch("/api/apiVTEXStatusChanger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId,
          authorizationCode
        })
      });
      const data = await response.json();

      if (response.ok) {
        setResultData(data);
        // Volvemos a consultar el pedido para actualizar el estado y el código de autorización
        await fetchOrder(null);
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
    <div
      className="p-6 max-w-md mx-auto bg-gray-800/50 backdrop-blur-md rounded-xl"
      style={{ boxShadow: "0 0 10px rgba(255,255,255,0.1)" }}
    >
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-200">
        Consulta y Actualización de Pedido VTEX
      </h1>

      {/* Formulario de búsqueda */}
      <form onSubmit={fetchOrder} className="flex flex-col space-y-4">
        <div>
          <label className="block mb-1 font-medium text-gray-300">ID del Pedido</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Ingrese el ID del Pedido"
            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !orderId}
          className="bg-blue-600 hover:bg-blue-500 text-gray-100 font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? "Procesando..." : "Buscar Pedido"}
        </button>
      </form>

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="mt-6 p-4 border border-red-500 rounded shadow bg-red-800 text-red-200">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Tabla con datos del pedido */}
      {orderData && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2 text-gray-200">Datos del Pedido</h2>
          <div className="overflow-x-auto bg-gray-800/40 backdrop-blur-sm rounded-lg p-2">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-3 font-bold uppercase text-sm text-gray-300 border-b border-gray-600">
                    CAMPO
                  </th>
                  <th className="py-2 px-3 font-bold uppercase text-sm text-gray-300 border-b border-gray-600">
                    VALOR
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(orderData).map(([key, value]) => (
                  <tr key={key} className="hover:bg-gray-700">
                    <td className="py-2 px-3 border-b border-gray-600 text-gray-200">
                      {key}
                    </td>
                    <td className="py-2 px-3 border-b border-gray-600 text-gray-200">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulario para actualizar el pedido (solo si está pendiente) */}
          {(vtexStatus === "pending" || vtexStatus === "payment-pending") && (
            <form onSubmit={handleUpdateStatus} className="flex flex-col space-y-4 mt-4">
              <div>
                <label className="block mb-1 font-medium text-gray-300">
                  Código de Autorización
                </label>
                <input
                  type="text"
                  value={authorizationCode}
                  onChange={(e) => setAuthorizationCode(e.target.value)}
                  placeholder="Ingrese el Código de Autorización"
                  className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !orderId || !authorizationCode}
                className="bg-green-600 hover:bg-green-500 text-gray-100 font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {isLoading ? "Procesando..." : "Aprobar Pedido"}
              </button>
            </form>
          )}

          {/* Si el pedido ya no está pendiente, se muestra un mensaje */}
          {!(vtexStatus === "pending" || vtexStatus === "payment-pending") && (
            <p className="mt-4 text-gray-300">
              Este pedido ya no está pendiente de pago, su estado actual es:{" "}
              <strong>{orderData.Estado}</strong>.
            </p>
          )}
        </div>
      )}

      {/* Card de éxito de actualización */}
      {resultData && (
        <div className="mt-6 p-4 border border-green-500 rounded shadow bg-green-800 text-green-200">
          <h2 className="text-xl font-bold mb-2">Actualización Exitosa</h2>
          <p>{resultData.message}</p>
          <p className="mt-2">
            <strong>Estado Final:</strong> {resultData.finalStatus}
          </p>
          <p>
            <strong>Código de Autorización:</strong> {authorizationCode}
          </p>
        </div>
      )}
    </div>
  );
};

export default VTEXStatusChangerForm;
