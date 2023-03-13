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
import dynamic from "next/dynamic";

const datosBilling = [];
const billingInfo = [];

const schema = yup.object().shape({
  billingAddress: yup.object().shape({
    Código_Postal: yup.string()
    //.required("Ingresa un Código Postal válido")
    ,
    Calle: yup
      .string()
      .matches(/^[a-zA-Z0-9\s]+$/, "Ingresa una Calle válida")
      .min(2, "Ingresa una Calle válida")
      .required("Calle es obligatoria"),
    Departamento: yup
      .string()
      //solo caracteres alfanumericos O NULO
      //.matches(/^[a-zA-Z0-9\s]+$/, "Ingresa un Número de Casa o depto válido")
      //.min(1, "Ingresa un Número de Casa o depto válido")
      // .required("Casa o depto es obligatorio"),
    // Ciudad: yup
    //   .string()
    //   .min(3, "Ingresa una Ciudad válida")
    //   .required("Ciudad es obligatoria"),
    // Comuna: yup
    //   .string()
    //   .min(3, "Ingresa una Comuna válida")
    //   .required("Comuna es obligatoria"),
    // Región: yup
    //   .string()
    //   .min(1, "Ingresa una Región válida")
    //   .required("Región es obligatoria")
    ,
      Comunas: yup
      .string()
      .min(1, "Ingresa una Comuna válida")
      .required("Comuna es obligatoria"),  
    Número: yup
      .string()
      //omitir caracteres especiales
      .matches(/^[0-9]+$/, "Ingresa un Número de Dirección válido")
      .min(1, "Ingresa un Número de Dirección válido")
      .required("Número de Dirección es obligatorio"),
  }),
});

export default function BillingInfo({ formStep, nextFormStep }) {

  const SelectLocalidades = dynamic(() => import("./selectLocalidades"), {
    ssr: false,
  });
  
  const Data = Datas;
  const { setFormValues } = useFormData();
  const formRef = useRef();
  const selectRef = useRef(null);
  const { dataH } = useDataData();

  async function handleSubmit(data) {
    console.log(selectRef.current.value);
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
    <div className={formStep === 1 ? styles.showForm : styles.hideForm}>
      <div className="mb-10 text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
      
      </div>
      <h2 className="mt-2 border rounded-md border-gray-500 bg-gray-200 dark:bg-gray-700 p-2.5 text-gray-200 text-center text-xl dark:text-gray-100">
        Información de Facturación
      </h2>

      <Form ref={formRef} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          {/* Tailwind forom Card */}
          {/* Datas contiene info para generar formularios */}
          <div className="invisible text-gray-100 dark:text-gray-400 max-h-8 max-w-0">
            
          </div>{" "}
        
          {Data.Datas[1].map(
            (data, index) => (
              // console.log("Esto es la data de billing: ", data),
              (
                // call internal api
                <Input
                  key={index}
                  name={data.campo}
                  label={data.detalle}
                  type={data.type}
                  valua={data.valua}
                  // component={data.component}
                />
              )
            )
          )}
          <SelectLocalidades selectRef={selectRef} name="billingAddress.Comunas" />
          {/* <ButtonToAddComponent
            nombre={"Dirección de Envío"}
            dataSelect={2}
            children={<CreatedAtomForm />}
          /> */}
          <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 hover:text-gray-100 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full" type="submit">Siguiente</button>
          {datosBilling.map(
            (datos, Bill) => (
              billingInfo.push(datos),
              (
                // console.log("referencai: " + billingInfo + "{{{Contacto}}}")
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
// campo valor flete en negocio
//datos de shipping en negocio
//crear todo esto en Hubspot

//sobre clientes en SAP
