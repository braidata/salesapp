import { useState, useEffect } from "react";
//import set lodash
import set from 'lodash/set';
import { useSession } from "next-auth/react";

const SelectComponent = () => {
  const [metadata, setMetadata] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [mode, setMode] = useState("get");
  const [store, setStore] = useState("Ventus");
  const [orderData, setOrderData] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [filteredOrderData, setFilteredOrderData] = useState(null);
  const { data: session } = useSession();
  let keys = [];

  const toggleTable = () => {
    setShowTable((prev) => !prev);
  };

  keys = [
    {
      key: "payment_method",
      placeholder: "Ejemplo: bacs"
    },
    {
      key: "payment_method_title",
      placeholder: "Ejemplo: Transferencia Bancaria"
    },
    {
      key: "meta_data._billing_rut",
      placeholder: "Ejemplo: 77328906-9"
    },
    {
      key: "meta_data._billing_RUT_Empresa",
      placeholder: "Ejemplo: 77328906-9"
    },
    {
      key: "billing.address_1",
      placeholder: "Dirección: El Copihue"
    },
    {
      key: "billing.address_2",
      placeholder: "Número de Dirección: 3458 Casa 4"
    },
    {
      key: "meta_data.billing_Numero_Direccion",
      placeholder: "Número de Dirección: 3458 Casa 4"
    },
    {
      key: "meta_data.billing_Numero_dpto",
      placeholder: "Número de Dirección: 3458 Casa 4"
    },
    {
      key: "shipping.address_1",
      placeholder: "Dirección: El Copihue"
    },
    {
      key: "shipping.address_2",
      placeholder: "Número de Dirección: 3458 Casa 4"
    },
    {
      key: "meta_data.shipping_Numero_Direccion",
      placeholder: "Número de Dirección: 3458 Casa 4"
    },
    {
      key: "meta_data.shipping_Numero_dpto",
      placeholder: "Número de Dirección: 3458 Casa 4"
    },
    {
      key: "customer_note",
      placeholder: "Observación: Hay un gato en la moto"
    },
    {
      key: "meta_data.authorizationCode",
      placeholder: "Ejemplo: 148273202827"
    }

  ];

  const [sessionInfo, setSessionInfo] = useState();

  useEffect(() => {
    const fetchPermisos = async () => {
      const res = await fetch("/api/mysqlPerm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session ? session.session.user.email : null,
        }),
      });
      const data = await res.json();
      console.log("el permisos: ", data.user[0].rol);
      const userRol = data ? data.user[0].permissions : "No conectado";
      console.log("el permisos2: ", data.user[0].permissions);
      setSessionInfo(userRol);
    };

    fetchPermisos();
  }, [session]);

  const getNestedValue = (obj, key) => {
    if (key.startsWith("meta_data.")) {
      const metaDataKey = key.slice(10);
      const metaData = obj.meta_data.find((item) => item.key === metaDataKey);
      return metaData ? metaData.value : null;
    } else if (key.startsWith("shipping_lines.")) {
      const shippingLinesKey = key.slice(15);
      const shippingLines = obj.shipping_lines[0];
      return shippingLines ? shippingLines[shippingLinesKey] : null;
    } else {
      return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
    }
  };

  const cleanNestedKeys = (data, key) => {
    let cleanedKey = key;

    if (cleanedKey.startsWith("meta_data.")) {
      cleanedKey = cleanedKey.slice(10);
    } else if (cleanedKey.startsWith("shipping_lines.")) {
      cleanedKey = cleanedKey.slice(15);
    }

    if (cleanedKey.indexOf(".") > -1) {
      const parts = cleanedKey.split(".");
      parts.shift();
      cleanedKey = parts.join(".");
    }

    const keys = cleanedKey.split(".");
    let value = data;
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }

    return value;
  };

  const handleKeyChange = (e) => {
    const key = e.target.value;
    setSelectedKey(key);
    const selected = keys.find((k) => k.key === key);
    if (selected.key.startsWith("meta_data.")) {
      setPlaceholder("Ejemplo: " + JSON.stringify({ id: 123456, key: selected.key, value: selected.placeholder }));
    } else {
      setPlaceholder(selected?.placeholder || "");
    }
  };

  const handleStoreChange = (e) => {
    setStore(e.target.value);
    console.log("TIENDA: ", store);
  };

  const handleModeChange = (e) => {
    setMode(e.target.value);
    console.log("MODO: ", mode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = e.target.id.value;
    const key = e.target.key ? e.target.key.value : selectedKey;
    const value = e.target.value ? e.target.value.value : null;

    const metaDataKey = key.startsWith("meta_data.") ? key.slice(10) : key;

    let updatedData = {};
    if (metaDataKey.startsWith("_")) {
      updatedData.meta_data = [
        {
          key: metaDataKey,
          value,
        },
      ];
    } else {
      const keyParts = metaDataKey.split(".");
      const recursiveUpdate = (obj, parts, value) => {
        const currentKey = parts.shift();
        if (parts.length === 0) {
          obj[currentKey] = value;
        } else {
          if (!obj[currentKey]) {
            obj[currentKey] = {};
          }
          recursiveUpdate(obj[currentKey], parts, value);
        }
      };
      recursiveUpdate(updatedData, keyParts, value);
    }

    set(updatedData, key, value);

    try {
      const response = await fetch(`/api/ordersVentus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, updatedData, mode, store, user: session.session.user.name }),
      });

      const data = await response.json();
      console.log("Data",data);
      console.log("Data keys:", Object.keys(data));
      console.log("Keys:", keys.map((k) => k.key));

      const objeto = keys
        .filter((k) => getNestedValue(data, k.key) !== null)
        .reduce((obj, k) => {
          obj[k.key] = getNestedValue(data, k.key);
          return obj;
        }, {});

      setFilteredOrderData(objeto);
      console.log("OBJETO: ", filteredOrderData);

      setShowTable(true);

      return data;
    } catch (error) {
      // Handle fetch errors here
      //console.log(error);
    }
  };

  return (
    <>
      {sessionInfo === "ecommerce" || sessionInfo === "all" ? (
        <div className="max-w-sm p-2 mt-8 ml-4">
          <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
            Editor de Pedidos Woocommerce
          </h1>

          <form onSubmit={handleSubmit} >
            <div className="w-full flex flex-col justify-center gap-4">
              <label htmlFor="id" className="sr-only">ID</label>
              <input
                className="border rounded p-2 w-full"
                type="text"
                name="id"
                placeholder="ID"
              />

              <label htmlFor="store" className="sr-only">Tienda</label>
              <select
                className="border rounded p-2 w-full"
                name="store"
                value={store}
                onChange={handleStoreChange}
              >
                <option value="Ventus">VENTUS</option>
                <option value="BLK">BLANIK</option>
                <option value="BBQ">BBQGRILL</option>
              </select>

              <label htmlFor="mode" className="sr-only">Modo</label>
              <select
                className="border rounded p-2 w-full"
                name="mode"
                value={mode}
                onChange={handleModeChange}
              >
                <option value="put">EDITAR</option>
                <option value="get">VER</option>
              </select>

              <label htmlFor="key" className="sr-only">Seleccionar clave</label>
              <select
                className="border rounded p-2 w-full"
                name="key"
                value={selectedKey}
                onChange={handleKeyChange}
              >
                <option value="">Seleccionar clave</option>
                {keys.map((key) => (
                  <option key={key.key} value={key.key}>
                    {key.key}
                  </option>
                ))}
              </select>

              <label htmlFor="value" className="sr-only">Valor</label>
              <input
                className="border rounded p-2 w-full"
                type="text" name="value" placeholder="Valor" />

              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                type="submit"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="max-w-sm p-2 mt-8 ml-4">
          <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
            Editor de Pedidos Woocommerce
          </h1>

          <form onSubmit={handleSubmit} >
            <div className="w-full flex flex-col justify-center gap-4">
              <label htmlFor="id" className="sr-only">ID</label>
              <input
                className="border rounded p-2 w-full"
                type="text"
                name="id"
                placeholder="ID"
              />

              <label htmlFor="store" className="sr-only">Tienda</label>
              <select
                className="border rounded p-2 w-full"
                name="store"
                value={store}
                onChange={handleStoreChange}
              >
                <option value="Ventus">VENTUS</option>
                <option value="BLK">BLANIK</option>
                <option value="BBQ">BBQGRILL</option>
              </select>

              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                type="submit"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}

      {showTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div> {/* Fondo con backdrop */}
          <div className="bg-white dark:bg-gray-800 max-w-lg p-6 rounded-lg shadow-lg relative">
            <button className="absolute top-1 right-1 font-bolt text-2xl text-gray-500 dark:text-gray-200" onClick={toggleTable}>
              &times;
            </button>
            <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
              Información del pedido:
            </h1>
            <table className="max-w-lg bg-gray-300 dark:bg-gray-800">
              <thead>
                <tr>
                  <th className="border">Clave</th>
                  <th className="border">Valor</th>
                </tr>
              </thead>
              <tbody>
                {keys
                  .filter((k) => cleanNestedKeys(orderData, k.key) !== null)
                  .map((k) => (
                    <tr key={k.key}>
                      <td className="border text-gray-800 dark:text-white">{k.key}</td>
                      <td className="border text-gray-800 dark:text-white">{JSON.stringify(cleanNestedKeys(orderData, k.key))}</td>
                    </tr>
                  ))}
                {Object.entries(filteredOrderData).map(([key, value]) => (
                  <tr key={key}>
                    <td className="border text-gray-800 dark:text-white">{key}</td>
                    <td className="border text-gray-800 dark:text-white">{JSON.stringify(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </>
  );
};

export default SelectComponent;


