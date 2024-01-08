import React, { useState, useEffect, useRef } from "react";
import { useField } from "@unform/core";
import styles from "../../styles/styles.module.scss";

const Select = ({ name, label, valua, options, ...rest }) => {
    const [selectedValue, setSelectedValue] = useState("");
    const [displayValue, setDisplayValue] = useState("");

    const selectRef = useRef();

    const { fieldName, registerField, error } = useField(name);

    useEffect(() => {
        const optionSeleccionada = options[valua.indexOf(selectedValue)];
        if (optionSeleccionada) {
            setDisplayValue(optionSeleccionada);
        }
    }, [selectedValue, options, valua]);

    useEffect(() => {
        registerField({
            name: fieldName,
            ref: selectRef.current,
            getValue: (ref) => {
                return ref.value;
            },
        });
    }, [fieldName, registerField]);

    return (
        <>
            <label className="mt-2 text-gray-900 text-md  sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md  focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500" htmlFor={fieldName}>{label}:</label>
            <select
                className="mb-2 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
                id={fieldName}
                ref={selectRef}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                {...rest}
            >
                <option value="">Selecciona una opción</option>
                {
                    options.map((option, index) => (
                        <option key={index} value={valua[index]}>
                            {option}
                        </option>
                    ))
                }
            </select>

            {error && <p className={styles.errorText}>{error}</p>}
        </>
    );
}

export default Select;
