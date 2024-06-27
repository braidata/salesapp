import { useState } from "react";
import { useSession } from "next-auth/react";

const SelectComponent = () => {
    const [store, setStore] = useState("Ventus");
    const [orderData, setOrderData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { data: session } = useSession();
    const [showSapButton, setShowSapButton] = useState(true);

    const [sessionInfo, setSessionInfo] = useState()

    const toggleModal = () => {
        setShowModal((prev) => !prev);
    };

    const handleStoreChange = (e) => {
        setStore(e.target.value);
    };

    const permisos = async () => {
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
        const userRol = data ? data.user[0].permissions : "No conectado";
        setSessionInfo(userRol)
        return sessionInfo
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const id = e.target.id.value;

        try {
            const response = await fetch(`/api/orderVentusPay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id, mode: "get", store }),
            });

            const data = await response.json();
            setOrderData({
                ID: data.id,
                Estado: data.status === 'invoiced' ? 'Facturado' :
                    (data.status === 'processing' ? 'Procesando' :
                        (data.status === 'pending' || 'on-hold' ? 'En espera' : data.status)),
                Nombre: `${data.billing.first_name} ${data.billing.last_name}`,
                Rut: data.meta_data.find(item => item.key === "_billing_rut")?.value || "N/A",
                Total: data.total
            });
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching order:", error);
        }
    };

    const handleSendToSAP = async () => {
        if (!orderData) return;

        try {
            const response = await fetch(`/api/orderVentusPay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: orderData.ID,
                    updatedData: { status: "processing" },
                    mode: "put",
                    store,
                    user: session.session.user.name
                }),
            });

            const data = await response.json();
            setOrderData({
                ...orderData,
                Estado: "Procesando"
            });
            setShowSapButton(false);
            alert("Estado de pedido cambiado a Procesando para integrar a SAP");
        } catch (error) {
            console.error("Error al cambiar de estado:", error);
            alert("Error al cambiar de estado, intenta nuevamente.");
        }
    };

    return (
        permisos(),
        sessionInfo === "payments" || sessionInfo === "all" ? (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                    Buscador de Pedidos Woocommerce
                </h1>

                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="flex flex-col space-y-2">
                        <input
                            className="border rounded p-2 dark:bg-gray-700 dark:text-white"
                            type="text"
                            name="id"
                            placeholder="ID del pedido"
                        />
                        <select
                            className="border rounded p-2 dark:bg-gray-700 dark:text-white"
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
                            Buscar Pedido
                        </button>
                    </div>
                </form>

                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Información del pedido</h2>
                                <button onClick={toggleModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="py-2 px-3 bg-gray-200 dark:bg-gray-700 font-bold uppercase text-sm text-gray-600 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">Campo</th>
                                            <th className="py-2 px-3 bg-gray-200 dark:bg-gray-700 font-bold uppercase text-sm text-gray-600 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(orderData).map(([key, value]) => (
                                            <tr key={key} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <td className="py-2 px-3 border-b border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{key}</td>
                                                <td className="py-2 px-3 border-b border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {showSapButton && (
                                <button
                                    className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
                                    onClick={handleSendToSAP}
                                >
                                    Enviar a SAP
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                    Buscador de Pedidos Woocommerce
                </h1>
                <p className="text-gray-600 dark:text-gray-400">No tienes permisos para acceder a esta funcionalidad.</p>
            </div>
        )
    );
}

export default SelectComponent;