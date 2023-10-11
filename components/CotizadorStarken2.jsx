import React, { useState } from 'react';

const TarifasComponent = () => {
  const [values, setValues] = useState({
    codigoCiudadOrigen: '',
    codigoCiudadDestino: '',
    alto: '',
    ancho: '',
    largo: '',
    kilos: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const [results, setResults] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Realizar la solicitud HTTP aquí
    try {
      const response = await fetch('/api/starkenCotiza2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        // Manejar la respuesta si es necesario
        const data = await response.json();
        setResults(data);
        console.log('Respuesta del servidor:', data);
      } else {
        console.error('Error al enviar valores al servidor');
      }
    } catch (error) {
      console.error('Error al enviar valores al servidor', error);
    }
  };

  return (
    <div className="bg-gray-300 w-full text-gray-900 dark:bg-gray-900 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2">
            <h1 className=" flex flex-col justify-center mx-4 my-2 text-xl font-semibold">Tarifas Antes</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label className="flex flex-col justify-center mx-4 my-2 ">Código Ciudad Origen:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="codigoCiudadOrigen"
                        value={values.codigoCiudadOrigen}
                        onChange={handleInputChange}
                    />
                    <label className="flex flex-col justify-center mx-4 my-2">Código Ciudad Destino:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="codigoCiudadDestino"
                        value={values.codigoCiudadDestino}
                        onChange={handleInputChange}
                    />
                    <label className="flex flex-col justify-center mx-4 my-2">Alto:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="alto"
                        value={values.alto}
                        onChange={handleInputChange}
                    />
                    <label className="flex flex-col justify-center mx-4 my-2">Ancho:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="ancho"
                        value={values.ancho}
                        onChange={handleInputChange}
                    />
                    <label className="flex flex-col justify-center mx-4 my-2">Largo:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="largo"
                        value={values.largo}
                        onChange={handleInputChange}
                    />
                    <label className="flex flex-col justify-center mx-4 my-2">Kilos:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="kilos"
                        value={values.kilos}
                        onChange={handleInputChange}
                    />

                </div>
                <div className="mt-4">
                    <button
                        type="submit"
                        className="bg-purple-300 text-gray-900 dark:bg-purple-900 dark:text-gray-200 w-full p-4 rounded-lg shadow-md mx-2 my-2"
                    >
                        Enviar
                    </button>
                </div>
            </form>
            {results && (
                <div className="mt-4">
                    <h2 className="text-lg font-semibold">Resultados:</h2>
                    <table className="table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Tipo de Entrega</th>
                                <th className="px-4 py-2">Tipo de Servicio</th>
                                <th className="px-4 py-2">Costo Total</th>
                                <th className="px-4 py-2">Días de Entrega</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results && Object.entries(results.listaTarifas).map((tarifa, index) => (
                                console.log("TARIFA", tarifa[1]),
                                <tr key={index}>
                                    <td className="border px-4 py-2">{tarifa[1].tipoEntrega.descripcionTipoEntrega}</td>
                                    <td className="border px-4 py-2">{tarifa[1].tipoServicio.descripcionTipoServicio}</td>
                                    <td className="border px-4 py-2">{tarifa[1].costoTotal}</td>
                                    <td className="border px-4 py-2">{tarifa[1].diasEntrega}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
);
};

export default TarifasComponent;