import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form } from "@unform/web";
import Input from "../Input Fields/Input";
import { useFormData } from "../../context";
import { useDataData } from "../../context/data";
import * as yup from "yup";
import Datas from "../../lib/data";
import { validateRUT, getCheckDigit, generateRandomRUT } from "validar-rut";

const datosBilling = [];
const billingInfo = [];

const schema = yup.object().shape({
  billing: yup.object().shape({
    Giro: yup
      .string()
      .min(2, "Ingresa un giro válido")
      .required("Giro es obligatorio"),
    Razón_Social: yup
      .string()
      .min(2, "Ingresa una razón social válida")
      .required("Razón Social es obligatoria"),
    Rut_Empresa: yup
      .string()
      .test({
        name: "Rut",
        message: "Rut no válido",
        test: (value) => {
          return validateRUT(value);
        },
      })
      .min(9, "Ingresa un rut válido")
      .required("Rut es obligatorio"),
  }),
});

export default function BillingInfo2({ formStep, nextFormStep }) {
  const Data = Datas;
  const { setFormValues } = useFormData();
  const formRef = useRef();

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
    <div className={formStep === 2 ? styles.showForm : styles.hideForm}>
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
         
          {Data.Datas[5].map(
            (data, index) => (
              (
                // call internal api
                <Input
                  key={index}
                  name={data.campo}
                  label={data.detalle}
                  type={data.type}
                  valua={data.valua}
                />
              )
            )
          )}
          <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-600 hover:text-gray-300 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full" type="submit">Siguiente</button>
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
