import React, { useState } from 'react';
import axios from 'axios';

const TarifasComponent = () => {
    const [values, setValues] = useState({
        weight: '',
        from_place: 'Santiago', // Ejemplo de valor predeterminado, ajusta según sea necesario
        to_place: 'Valparaiso', // Ejemplo de valor predeterminado, ajusta según sea necesario
        carrier: 'SKN',
        service: 'normal',
        length: '',
        height: '',
        width: '',
    });

    const [result, setResult] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setValues({ ...values, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/enviameTarifas', values);
            setResult(response.data);
        } catch (error) {
            console.error('Error al enviar los datos a la API', error);
            setResult({ error: 'Ha ocurrido un error al obtener los datos' });
        }
    };

    return (
        <div className="bg-gray-300 w-full text-gray-900 dark:bg-gray-900 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2">
            <h1 className="text-xl font-semibold mx-4 my-2">Consultar Tarifas</h1>
            <form onSubmit={handleSubmit}>
                {/* Aquí van los inputs para los parámetros. Ejemplo: */}
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type="text"
                    name="weight"
                    placeholder="Peso"
                    value={values.weight}
                    onChange={handleInputChange}
                />
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type="text"
                    name="from_place"
                    placeholder="Desde"
                    value={values.from_place}
                    onChange={handleInputChange}
                />
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type="text"
                    name="to_place"
                    placeholder="Hacia"
                    value={values.to_place}
                    onChange={handleInputChange}
                />
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type="text"
                    name="carrier"
                    placeholder="Carrier"
                    value={values.carrier}
                    onChange={handleInputChange}
                />
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type="text"
                    name="service"
                    placeholder="Servicio"
                    value={values.service}
                    onChange={handleInputChange}
                />
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type='text'
                    name='length'
                    placeholder='Largo'
                    value={values.length}
                    onChange={handleInputChange}
                />
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type='text'
                    name='height'
                    placeholder='Alto'
                    value={values.height}
                    onChange={handleInputChange}
                />
                <input
                    className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                    type='text'
                    name='width'
                    placeholder='Ancho'
                    value={values.width}
                    onChange={handleInputChange}
                />


                {/* Repite esto para los demás campos como from_place, to_place, etc. */}

                <button
                    type="submit"
                    className="bg-purple-300 text-gray-900 dark:bg-purple-900 dark:text-gray-200 w-full p-4 rounded-lg shadow-md mx-2 my-2"
                >
                    Consultar
                </button>
            </form>

            {result && result.data && result.data.length > 0 && result.data[0].services.length > 0 && (
    <div className="mt-4">
        <h2 className="text-lg font-semibold">Precio Formateado:</h2>
        <p className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2">
            {result.data[0].services[0].price_formatted}
        </p>
    </div>
)}

        </div>
    );
};

export default TarifasComponent;
