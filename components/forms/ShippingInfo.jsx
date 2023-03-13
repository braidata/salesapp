import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form } from "@unform/web";
import Input from "../Input Fields/Input";
import { useFormData } from "../../context";
import { useDataData } from "../../context/data";
import * as yup from "yup";
import Datas from "../../lib/data";
import CreatedAtomForm from "../createdAtomForm";
import ButtonToAddComponent from "../buttonToAddComponent";
//import SelectLocalidades from "./SelectLocalidades";
import dynamic from "next/dynamic";
import Select from "../Input Fields/Select";


const datosShipping = [];
const shippingInfo = [];
const schema = yup.object().shape({
  shipping: yup.object().shape({
    Tipo_de_Despacho: yup
      .string()
      .min(1, "Ingresa un  Tipo_de_Despacho válido")
      // .required("Tipo_de_Despacho es obligatorio")
      ,
    Fecha_de_Despacho_o_Retiro: yup
      .string()
      .min(3, "Ingresa una Fecha_de_Despacho_o_Retiro válida")
      // .required("Fecha_de_Despacho_o_Retiro es obligatoria")
      ,
    Nombre_Retira: yup
      .string()
      .min(3, "Ingresa un Nombre_Retira válido"),
    Rut_Retira: yup
      .string()
      .min(1, "Ingresa un Rut_Retira válido"),
    Comunas: yup
      .string()
      .min(1, "Ingresa una Comuna válida"),  
    Observación: yup
      .string()
      .min(1, "Ingresa una Observación válida")
      // .required("Observación es obligatoria")
      ,
  }),
});

export default function shippingInfos({ formStep, nextFormStep }) {
  const SelectLocalidades = dynamic(() => import("./selectLocalidades"), {
    ssr: false,
  });


  const Data = Datas;
  const { setFormValues } = useFormData();
  const formRef = useRef();
  const selectRef = useRef(null);
  const { dataH } = useDataData();



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
    <div className={formStep === 4 ? styles.showForm : styles.hideForm}>
      <div className="mb-10 text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
       
      </div>
      <h2 className="mt-2 border rounded-md border-gray-500 bg-gray-200 dark:bg-gray-700 p-2.5 text-gray-200 text-center text-xl dark:text-gray-100">
        Información de Despacho y Retiro
      </h2>

      <Form ref={formRef} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          {/* Tailwind forom Card */}
          {/* Datas contiene info para generar formularios */}
          <div className="invisible text-gray-100 dark:text-gray-400 max-h-8 max-w-0">
           
          </div>{" "}

          <SelectLocalidades selectRef={selectRef} name="shippingAddress.Comunas" />
          
          {Data.Datas[6].map(
            (data, index) => (
              // console.log("Esto es la data de shipping: ", data),
              (
                // call internal api
                data.campo != "shipping.Tipo_de_Despacho" ?

           <Input
              key={index}
              name={data.campo}
              label={data.detalle}
              type={data.type}
              valua={data.valua}
            /> :
              <Select
              key={index}
              name={data.campo}
              label={data.detalle}
              type={data.type}
              valua={data.valua}
              options={data.options}
            />
              )
            )
          )}
          
          {/* <ButtonToAddComponent
            nombre={"Dirección de Envío"}
            dataSelect={2}
            children={<CreatedAtomForm />}
          /> */}
          <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-600 hover:text-gray-300 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full" type="submit">Siguiente</button>
          {datosShipping.map(
            (datos, Bill) => (
              shippingInfo.push(datos),
              (
                // console.log("referencai: " + shippingInfo + "{{{Contacto}}}")
                <pre className="text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
                  {JSON.stringify(datos)}
                </pre>
              )
            )
          )}
        </div>
      </Form>
    </div>
  );
}

//tipo de despacho
//fecha de despacho o retiro
// datos de retira rut nombre patente
//crear campo flete en negocio
//observacion
