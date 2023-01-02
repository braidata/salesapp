import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form } from "@unform/web";
import Input from "../Input Fields/Input";
import { useFormData } from "../../context";
import * as yup from "yup";
import Datas from "../../lib/data";
import CreatedAtomForm from "../../components/createdAtomForm";
import ButtonToAddComponent from "../../components/buttonToAddComponent";

const schema = yup.object().shape({
  payment: yup.object().shape({
    Metodo_de_Pago: yup
      .string()
      .min(2, "Ingresa un Método de Pago válido")
      .required("Método de Pago es obligatorio"),
    Código_de_Autorización: yup
      .string()
      .min(2, "Ingresa un Código de Autorización válido")
      .required("Código de Autorización es obligatorio"),
    Cantidad_de_Pagos: yup
      .string()
      .min(1, "Ingresa una Cantidad de Pagos válida")
      .required("Cantidad de Pagos es obligatoria"),
    Fecha_de_Pago: yup
      .string()
      .min(1, "Ingresa una Fecha de Pago válida")
      .required("Fecha de Pago es obligatoria"),
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
            <Input
              key={index}
              name={data.campo}
              label={data.detalle}
              type={data.type}
              valua={data.valua}
            />
          ))}
          <ButtonToAddComponent
            nombre={"Medio de Pago"}
            dataSelect={4}
            children={<CreatedAtomForm />}
          />
        </div>
        <button className="mt-2 mb-5 bg-blue-900/90 border border-gray-300 text-gray-900 text-sm rounded-lg hover:bg-blue-800/90 focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" type="submit">Siguiente</button>
      </Form>
    </div>
  );
}

//orden de compra
// clientes con crédito
