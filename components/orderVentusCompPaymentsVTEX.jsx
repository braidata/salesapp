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
    return data.authorizationCode || "";
  } catch (error) {
    console.error("Error al obtener auth code desde VTEXPay:", error);
    return "";
  }
}

const VTEXStatusChangerForm = () => {
  const [orderId, setOrderId] = useState("");
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [vtexStatus, setVtexStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Realiza el fetch del pedido a VTEX por orderId y mapea los datos para la tabla.
   */
  const fetchOrder = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setOrderData(null);
    setResultData(null);

    try {
      const response = await fetch(`/api/apiVTEX?orderId=${orderId}`);
      const data = await response.json();

      if (response.ok) {
        const transaction = data.paymentData?.transactions?.[0];
        const payment = transaction?.payments?.[0];
        let authCodeFromTx = payment?.connectorResponses?.authorizationCode || "";
        
        if (!authCodeFromTx) {
          authCodeFromTx = await fetchAuthCodeFromPay(orderId);
        }

        if (authCodeFromTx) {
          setAuthorizationCode(authCodeFromTx);
        }

        const translatedStatus = mapVtexStatusToSpanish(data.status);

        const mappedData = {
          ID: data.orderId || "N/A",
          Estado: translatedStatus,
          Nombre:
            data.clientProfileData?.firstName && data.clientProfileData?.lastName
              ? `${data.clientProfileData.firstName} ${data.clientProfileData.lastName}`
              : "N/A",
          Rut: data.clientProfileData?.document || "N/A",
          "Rut de Empresa": data.clientProfileData?.corporateDocument || "N/A",
          Total: data.value ? (data.value / 100).toFixed(0) : "0",
          "Método de Pago": payment?.paymentSystemName || "N/A",
          "Código de Autorización": authCodeFromTx || "N/A"
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
   * Actualiza el estado del pedido en VTEX.
   * Solo envía el authorizationCode si no está vacío.
   */
  const handleUpdateStatus = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setResultData(null);

    try {
      const payload = { orderId };
      if (authorizationCode && authorizationCode.trim()) {
        payload.authorizationCode = authorizationCode.trim();
      }

      const response = await fetch("/api/apiVTEXStatusChanger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        setResultData(data);
        await fetchOrder();
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

      {/* Búsqueda de pedido */}
      <div className="flex flex-col space-y-4">
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
          onClick={fetchOrder}
          disabled={isLoading || !orderId}
          className="bg-blue-600 hover:bg-blue-500 text-gray-100 font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? "Procesando..." : "Buscar Pedido"}
        </button>
      </div>

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

          {/* Actualización del pedido (solo si está pendiente) */}
          {(vtexStatus === "pending" || vtexStatus === "payment-pending") && (
            <div className="flex flex-col space-y-4 mt-4">
              <div>
                <label className="block mb-1 font-medium text-gray-300">
                  Código de Autorización <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={authorizationCode}
                  onChange={(e) => setAuthorizationCode(e.target.value)}
                  placeholder="Ingrese el Código de Autorización (opcional)"
                  className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Si se deja vacío, se procesará sin código de autorización
                </p>
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={isLoading || !orderId}
                className="bg-green-600 hover:bg-green-500 text-gray-100 font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {isLoading ? "Procesando..." : "Aprobar Pedido"}
              </button>
            </div>
          )}

          {/* Mensaje para pedidos que ya no están pendientes */}
          {!(vtexStatus === "pending" || vtexStatus === "payment-pending") && (
            <p className="mt-4 text-gray-300">
              Este pedido ya no está pendiente de pago, su estado actual es:{" "}
              <strong>{orderData.Estado}</strong>.
            </p>
          )}
        </div>
      )}

      {/* Card de éxito */}
      {resultData && (
        <div className="mt-6 p-4 border border-green-500 rounded shadow bg-green-800 text-green-200">
          <h2 className="text-xl font-bold mb-2">Actualización Exitosa</h2>
          <p>{resultData.message}</p>
          <p className="mt-2">
            <strong>Estado Final:</strong> {resultData.finalStatus}
          </p>
          {authorizationCode && (
            <p>
              <strong>Código de Autorización:</strong> {authorizationCode}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VTEXStatusChangerForm;