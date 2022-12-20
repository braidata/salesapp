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
    <div className={formStep === 5 ? styles.showForm : styles.hideForm}>
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
        <button type="submit">Enviar Pedido</button>
      </Form>
    </div>
  );
}

//observaciones *
