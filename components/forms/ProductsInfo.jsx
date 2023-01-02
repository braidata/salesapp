import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form, Scope } from "@unform/web";
import Input from "../Input Fields/Input";
import { useFormData } from "../../context";
import * as yup from "yup";
import Datas from "../../lib/data";
import CreatedAtomForm from "../../components/createdAtomForm";
import ButtonToAddComponent from "../../components/buttonToAddComponent";
import { useDataData } from "../../context/data";

const datosProducts = [];
const productsInfo = [];

const schema = yup.object().shape({
  SKU: yup.string().min(2, "Ingresa un SKU válido"),
  // .required("SKU es obligatorio"),
  Nombre_Producto: yup.string().min(2, "Ingresa un Nombre de Producto válido"),
  // .required("Nombre de Producto es obligatorio"),
  Precio: yup.string().min(4, "Ingresa un Precio válido"),
  // .required("Precio es obligatorio"),
  Cantidad: yup.string().min(1, "Ingresa una Cantidad válida"),
  // .required("Cantidad es obligatorio"),
  Flete: yup.string().min(3, "Ingresa un Flete válido"),
  // .required("Flete es obligatorio"),
});

export default function ProductsInfo({ formStep, nextFormStep }) {
  const Data = Datas;
  const { setFormValues } = useFormData();
  const formRef = useRef();

  const { dataH } = useDataData();
  // let dato1 = [];
  let datoM = [];
  let lin = dataH.lines;
  // const products = dataH.products[0] ? dataH.products[0] : "no data";
  // const productsP = products ? products[0].properties : "no data";

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
    <div className={formStep === 3 ? styles.showForm : styles.hideForm}>
      <div className="mb-10 text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
      </div>
      <h2 className="mt-2 border rounded-md border-gray-500 bg-gray-200 dark:bg-gray-700 p-2.5 text-gray-200 text-center text-xl dark:text-gray-100">
        Información de Productos
      </h2>

      <Form ref={formRef} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          {/* Tailwind forom Card */}
          {/* Datas contiene info para generar formularios */}
          <div className="invisible text-gray-100 dark:text-gray-400 max-h-8 max-w-0">
           
          </div>{" "}
         
          {Data.Datas[3].map((data, index) => (
            // call internal api
            <Input
              key={index}
              name={data.campo}
              label={data.detalle}
              type={data.type}
              valua={data.valua}
            />

          ))}
          <ButtonToAddComponent
            nombre={"Producto"}
            dataSelect={3}
            children={<CreatedAtomForm />}
          />
          {datosProducts.map(
            (datos, Bill) => (
              productsInfo.push(datos),
              (
                <pre className="text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
                  {JSON.stringify(datos)}
                </pre>
              ),
              (<div></div>)
            )
          )}
        </div>
        <button type="submit">Siguiente</button>
      </Form>
    </div>
  );
}
