import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form } from "@unform/web";
import Input from "../Input Fields/Input";
import { useFormData } from "../../context";
import * as yup from "yup";
import Datas from "../../lib/data";
import CreatedAtomForm from "../../components/createdAtomForm";
import ButtonToAddComponent from "../../components/buttonToAddComponent";
import { useDataData } from "../../context/data";
import SelectProductos from "./selectProducts";

const datosProducts = [];
const productsInfo = [];

// Función para consultar stock
async function checkStockAvailable(sku, quantityRequested) {
    try {
        const response = await fetch(`/api/apiSAPStock?Material=${sku}&werks=1100&lgort=1014`);
        if (response.ok) {
            const data = await response.json();
            if (data.stock_disp >= quantityRequested) {
                return true;
            }
        }
    } catch (error) {
        console.error("Error al comprobar stock", error);
    }
    return false;
}

// Agregamos el método a yup
yup.addMethod(yup.string, "checkStock", function () {
  return this.test('check-stock', 'Cuidado stock insuficiente de cierto material', async function (value) {
      const { products } = this.parent;
      const { SKU, Cantidad } = products;

      // No es necesario registrar cada vez, pero lo mantendré aquí por si aún quieres verlo.
      console.log("SKU:", SKU, "Cantidad:", Cantidad);

      const isValid = await checkStockAvailable(SKU, Cantidad);
      return isValid || this.createError({ message: 'Cuidado stock insuficiente de cierto material' });
  });
});


const schema = yup.object().shape({
  SKU: yup.string().min(2, "Ingresa un SKU válido"),
  Nombre_Producto: yup.string().min(2, "Ingresa un Nombre de Producto válido"),
  Precio: yup.string().matches(
    /^[0-9]+$/,
    "Ingresa un Número de Precio válido").min(4, "Ingresa un Precio válido"),
  Cantidad: yup.string().min(1, "Ingresa una Cantidad válida"),
  // Flete: yup.string().min(3, "Ingresa un Flete válido"),
});

export default function ProductsInfo({ formStep, nextFormStep }) {
  // const SelectProducts = dynamic(() => import("./selectProducts"), {
  //   ssr: false,
  // });
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
    console.log("Form Data:", data);
    try {
      formRef.current.setErrors({});
      console.log("ref f:", formRef.current);
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
          <SelectProductos />
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
              console.log(datos),
              productsInfo.push(datos)
            )
          )}
        </div>
        <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-600 hover:text-gray-300 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full" type="submit">Siguiente</button>
      </Form>
    </div>
  );
}


//className="mt-2 mb-5 bg-blue-900/90 border border-gray-300 text-gray-900 text-sm rounded-lg hover:bg-blue-800/90 focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
