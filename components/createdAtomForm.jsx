//create new atom form+button button
import React, { useRef } from "react";
import { Form, Scope } from "@unform/web";
import Input from  "../components/Input Fields/Input";
import { useFormData } from "../context";
import * as yup from "yup";
import Datas from "../lib/data";



const schema = yup.object().shape({
    productos: yup.object().shape({
        SKU: yup



.string().min(2, "Ingresa un SKU válido"),
        SKU: yup.string().min(2, "Ingresa un SKU de Producto válido"),
        // .required("SKU es obligatorio"),
        Nombre_Producto: yup.string().min(2, "Ingresa un Nombre de Producto válido"),
        // .required("Nombre de Producto es obligatorio"),
        Precio: yup.string().min(4, "Ingresa un Precio válido"),
        // .required("Precio es obligatorio"),
        Cantidad: yup.string().min(1, "Ingresa una Cantidad válida"),
        // .required("Cantidad es obligatorio"),
        Descuento: yup.string().min(3, "Ingresa un Descuento válido"),
        // .required("Flete es obligatorio"),
    })
});



export default function ProductsInfo({ formStep, nextFormStep, cuenta, dataSelect, dato1 }) {
    const cuentaI = cuenta
    const dataSelectI = parseInt(dataSelect)
    console.log(dataSelectI)
    const Data = Datas;
    const { setFormValues } = useFormData();
    const formRef = useRef();
    

    async function handleSubmit(data) {
        try {
            formRef.current.setErrors({});
            await schema.validate(data, {
                abortEarly: false,
            });
            // Validation passed - do something with data
            setFormValues(data);
            nextFormStep();
        } catch (err) {
            const errors = {};
            // Validation failed - do show error
            if (err instanceof yup.ValidationError) {
                console.log(err.inner);
                // Validation failed - do show error
                err.inner.forEach((error) => {
                    errors[error.path] = error.message;
                });
                formRef.current.setErrors(errors);
            }
        }
    }

    return (
        
        <div className="w-100">
            
            {Data.Datas[dataSelectI].map((data, index) => (
                
                console.log(data, cuentaI),
                
                <Input  key={index} name={data.campo + "-" + cuentaI} label={data.detalle} type={data.type} valua={data.valua} /> 
                
       
        ))}
                
        </div>
    );
}