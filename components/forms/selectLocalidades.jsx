import React from "react";
import Datas from "../../lib/data";
import {useState, useEffect} from "react";

 
const Data = Datas;


//console.log("Data", Datas)


const SelectLocalidades = () => {



    //retorn un selector de regiones, ciudades y comunas anidadas

    //const Data = Datas;
    const [regiones, setRegiones] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [comunas, setComunas] = useState([]);

    const [region, setRegion] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [comuna, setComuna] = useState("");

    useEffect(() => {
        setRegiones(Data.Datas[7]);
    }, []);

    useEffect(() => {

        if (region) {
            console.log("regionx", region)
            setCiudades(Data.Datas[9][region]);
        } else {
            setCiudades([]);
        }
    }
    , [region]);

    useEffect(() => {
            
            if (ciudad) {
                console.log("ciudadanocouma", ciudad)
                setComunas(Data.Datas[8][ciudad]);
            } else {
                setComunas([]);
            }
        }
        , [ciudad]);

        console.log("regione", region, comuna,ciudad, regiones, ciudades, comunas)

    return (
        <div>
            <select

                value={region}
                onChange={(e) => setRegion(e.target.value)}
            >
                <option value="">Selecciona una Región</option>
                {Object.entries(regiones).map((key, value) => (
                    console.log("key", key, "value", value),
                    <option key={value} value={value}>
                        {key[1].nombre}
                    </option>
                ))}
                
            </select>

            <select
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
            >
                <option value="">Selecciona una Ciudad</option>
                {console.log("ciudades", ciudades)}
                
                    <option key={ciudades.id} value={ciudades.id}>
                        {ciudades.nombre}
                    </option>
              
            </select>

            <select
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
            >
                <option value="">Selecciona una Comuna</option>
                {Object.entries(comunas).map((key, value) => (
                    console.log("comuna",comunas, key, value),
                    <option key={value} value={comunas[2]}>
                        {comunas[2]}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectLocalidades;








   

