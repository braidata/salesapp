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

const datosBilling = [];
const billingInfo = [];

const schema = yup.object().shape({
  billingAddress: yup.object().shape({
    Código_Postal: yup.string().required("Ingresa un Código Postal válido"),
    Calle: yup
      .string()
      .min(2, "Ingresa una Calle válida")
      .required("Calle es obligatoria"),
    Departamento: yup
      .string()
      .min(1, "Ingresa un Número de Casa o depto válido")
      .required("Casa o depto es obligatorio"),
    Ciudad: yup
      .string()
      .min(3, "Ingresa una Ciudad válida")
      .required("Ciudad es obligatoria"),
    Comuna: yup
      .string()
      .min(3, "Ingresa una Comuna válida")
      .required("Comuna es obligatoria"),
    Región: yup
      .string()
      .min(1, "Ingresa una Región válida")
      .required("Región es obligatoria"),
    Número: yup
      .string()
      .min(1, "Ingresa un Número de Dirección válido")
      .required("Número de Dirección es obligatorio"),
  }),
});

export default function BillingInfo({ formStep, nextFormStep }) {
  const Data = Datas;
  const { setFormValues } = useFormData();
  const formRef = useRef();
  const { dataH } = useDataData();
  let dato1 = [];
  //console.log("dataH", dataH.billing ? dataH.billing[0].properties : "no data");
  const billing = dataH.billing ? dataH.billing[0] : "no data";
  const billingP = billing ? billing.properties : "no data";

  console.log(
    "billing",
    billingP ? billingP.calle || billing : "No Data",
    billingP ? billingP.casa_depto || billing : "No Data"
  );
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
    <div className={formStep === 1 ? styles.showForm : styles.hideForm}>
      <div className="mb-10 text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
        {billingP
          ? datosBilling.push(
              billingP.rut,
              billingP.calle,
              billingP.numero_direccion,
              billingP.casa_depto,
              billingP.state,
              billingP.city,
              billingP.comuna,
              billingP.zip
            )
          : "No Data"}
      </div>
      <h2 className="mt-2 border rounded-md border-gray-500 bg-gray-200 dark:bg-gray-700 p-2.5 text-gray-200 text-center text-xl dark:text-gray-100">
        Información de Facturación
      </h2>

      <Form ref={formRef} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          {/* Tailwind forom Card */}
          {/* Datas contiene info para generar formularios */}
          <div className="invisible text-gray-100 dark:text-gray-400 max-h-8 max-w-0">
            {datosBilling.map(
              (datos, Bill) => (
                console.log("referencai: " + datos + "--"), dato1.push(datos)
              )
            )}
          </div>{" "}
          {dato1.length > 0 ? (
            <h3 className="mb-5 bg-orange-500 px-4 rounded-md w-60 text-gray-100 text-sm font-bold dark:text-gray-200">
              DATOS HUBSPOT CARGADOS
            </h3>
          ) : (
            <h3 className="mb-5 bg-orange-700 px-4 rounded-md w-60 text-gray-100 text-md dark:text-gray-200">
              No hay datos HubSpot Cargados
            </h3>
          )}
          {Data.Datas[1].map(
            (data, index) => (
              console.log("Esto es la data de billing: ", data),
              (
                // call internal api
                <Input
                  key={index}
                  name={data.campo}
                  label={data.detalle}
                  type={data.type}
                  valua={dato1[1 + index]}
                />
              )
            )
          )}
          <ButtonToAddComponent
            nombre={"Dirección de Envío"}
            dataSelect={2}
            children={<CreatedAtomForm />}
          />
          <button type="submit">Siguiente</button>
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
