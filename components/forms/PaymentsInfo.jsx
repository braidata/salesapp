import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form } from "@unform/web";
import Input from "../Input Fields/Input";
//import Select from "../Select Fields/Select";
import { useFormData } from "../../context";
import * as yup from "yup";
import Datas from "../../lib/data";
import CreatedAtomForm from "../../components/createdAtomForm";
import ButtonToAddComponent from "../../components/buttonToAddComponent";
import { validateRUT, getCheckDigit, generateRandomRUT } from "validar-rut";
import Select from "../Input Fields/SelectV";

const schema = yup.object().shape({
  payment: yup.object().shape({
    Metodo_de_Pago: yup
      .string()
      .min(1, "Ingresa un Método de Pago válido")
      .required("Método de Pago es obligatorio"),
      
    orden_de_compra: yup
      .string(),
      // .min(2, "Ingresa un Código de Autorización válido")
      // .required("Código de Autorización es obligatorio")
      
    Tipo_de_Pago: yup
      .string()
      .min(1, "Ingresa un Tipo de Pago válido")
      .required("Tipo de Pago es obligatorio")
      ,
    
  }),
});

export default function PaymentsInfo({ formStep, nextFormStep }) {
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
    <div className={formStep === 5 ? styles.showForm : styles.hideForm}>
      <h2 className="mt-2 border rounded-md border-gray-500 bg-gray-200 dark:bg-gray-700 p-2.5 text-gray-200 text-center text-xl dark:text-gray-100">
        Información de Pagos
      </h2>
      <Form ref={formRef} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          {Data.Datas[4].map((data, index) => (

            data.campo === "payment.orden_de_compra" ?

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
            


          ))}
          {/* <ButtonToAddComponent
            nombre={"Medio de Pago"}
            dataSelect={4}
            children={<CreatedAtomForm />}
          /> */}
        </div>
        <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-600 hover:text-gray-300 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full" type="submit">Siguiente</button>
      </Form>
    </div>
  );
}

//orden de compra
// clientes con crédito
