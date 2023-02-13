import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form } from "@unform/web";
import CheckBox from "../Input Fields/CheckBox";
import { useFormData } from "../../context";
import * as yup from "yup";
import ProductTable from "../../components/productTable";


const schema = yup.object().shape({
  checkbox: yup.bool().oneOf([true], "Confirma que revisaste los datos"),
});



export default function ConfirmPurchase({ formStep, nextFormStep }) {
  const { data, setFormValues } = useFormData();



  

  

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
    <div className={formStep === 6 ? styles.showForm : styles.hideForm}>
      <h2 className="mt-2 border rounded-md border-gray-500 bg-gray-200 dark:bg-gray-700 p-2.5 text-gray-200 text-center text-xl dark:text-gray-100">
        Revisar Información y Envíar Pedido
      </h2>
      {Object.entries(data).map((deal) => (
        //<DealCard  data={deal} />

        <ProductTable
          keyN={deal[0]}
          value={Object.keys(deal[1])}
          value2={Object.values(deal[1])}
        />
      ))}

      <Form ref={formRef} onSubmit={handleSubmit}>
        <div className="mt-5 mb-5">
          <div className={styles.formRow}>
            <CheckBox name="checkbox" label="Revisaste los datos?" />
          </div>
        </div>
        <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-600 hover:text-gray-300 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full" type="submit">Enviar Pedido</button>
      </Form>
    </div>
  );
}

//observaciones *
