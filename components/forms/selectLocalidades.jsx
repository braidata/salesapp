import React from "react";
import Datas from "../../lib/data";
import { useState, useEffect, useRef } from "react";
import { useField } from "@unform/core";
import styles from "../../styles/styles.module.scss";

const Data = Datas;
const comus = [];

// //console.log("Data", Datas)

const SelectLocalidades = (props, ...rest) => {
  //retorn un selector de regiones, ciudades y comunas anidadas

  //const Data = Datas;
  const [regiones, setRegiones] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [comunas, setComunas] = useState([]);

  const [region, setRegion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [comuna, setComuna] = useState("");

  //const inputRef = useRef();

  const { fieldName, defaultValue, registerField, error } = useField(props.name);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: props.selectRef.current,
      getValue: (ref) => {
        return ref.value;
      },
    });
  }, [fieldName, registerField]);

  useEffect(() => {
    setRegiones(Data.Datas[7]);
  }, []);

  useEffect(() => {
    if (region) {
      // console.log("regionx", region);
      setCiudades(Data.Datas[9][region]);
      return;
    } else {
      setCiudades([]);
    }
  }, [region]);

  useEffect(() => {

    if (ciudad) {
      comus.splice(0, comus.length);
      for (var i = 0; i < Data.Datas[8].length; i++) {
        if (Data.Datas[8][i].region == ciudad) {
          //limpiar array de comunas

          //agregar comunas al array
          comus.push(Data.Datas[8][i].nombre);

        }
      }
      setComunas(comus);
    } else {
      setComunas([]);
    }
  }, [ciudad]);


  return (
    <>

      <label className=" mt-2 text-gray-900 text-md  sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md  focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        Región * {" "}
      </label>
      <select
        className="mb-2 bg-gray-600 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      >
        <option
          className="mb-2 bg-gray-500 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
          value=""
        >
          Selecciona una Región
        </option>
        {Object.entries(regiones).map(
          (key, value) => (
            // console.log("key", key, "value", value),
            (
              <option
                className="mb-2 bg-gray-500 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
                key={value}
                value={value}
              >
                {key[1].nombre}
              </option>
            )
          )
        )}
      </select>

      <label className=" mt-2 text-gray-900 text-md  sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md  focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        Ciudad * {" "}
      </label>
      <select
        className="mb-2 bg-gray-600 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
      >
        <option
          className="mb-2 bg-gray-500 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
          value=""
        >
          Selecciona una Ciudad
        </option>
        {/* {console.log("ciudades", ciudades)} */}

        <option
          className="mb-2 bg-gray-500 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
          key={ciudades.id}
          value={ciudades.region}
        >
          {ciudades.nombre}
        </option>
      </select>

      <label className=" mt-2 text-gray-900 text-md  sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md  focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        Comuna * {" "}
      </label>
      <select
        ref={props.selectRef}
        className="mb-2 bg-gray-600 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
        value={comuna}
        onChange={(e) => setComuna(e.target.value)}
      >
        <option value="">Selecciona una Comuna</option>
        {comunas.map(
          (comuna, value) => (
            // console.log("ciudadan keymuna", comuna, value),
            (
              <option
                id={fieldName}
                //ref={inputRef}
                className="mb-2 bg-gray-500 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
                key={comuna}
                value={comunas[value]}
                {...rest}
              >
                {comunas[value]}
              </option>
            )
          )
        )}
      </select>

      {error && <p className={styles.errorText}>{error}</p>}

    </>


  );
};

export default SelectLocalidades;
