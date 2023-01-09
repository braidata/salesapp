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
        <button className="mt-2 mb-5 bg-blue-900/90 border border-gray-300 text-gray-900 text-sm rounded-lg hover:bg-blue-800/90 focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" type="submit">Enviar Pedido</button>
      </Form>
    </div>
  );
}

//observaciones *
