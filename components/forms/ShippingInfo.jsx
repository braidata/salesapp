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

const datosShipping = [];
const shippingInfo = [];
const schema = yup.object().shape({
  shipping: yup.object().shape({
    Tipo_de_Despacho: yup
      .string()
      .min(1, "Ingresa un  Tipo_de_Despacho válido")
      .required("Tipo_de_Despacho es obligatorio"),
    Fecha_de_Despacho_o_Retiro: yup
      .string()
      .min(3, "Ingresa una Fecha_de_Despacho_o_Retiro válida")
      .required("Fecha_de_Despacho_o_Retiro es obligatoria"),
    Nombre_Retira: yup
      .string()
      .min(3, "Ingresa un Nombre_Retira válido")
      .required("Nombre_Retira es obligatorio"),
    Rut_Retira: yup
      .string()
      .min(1, "Ingresa un Rut_Retira válido")
      .required("Rut_Retira es obligatorio"),
    Observación: yup
      .string()
      .min(1, "Ingresa una Observación válida")
      .required("Observación es obligatoria"),
  }),
});

export default function shippingInfo({ formStep, nextFormStep }) {
  const Data = Datas;
  const { setFormValues } = useFormData();
  const formRef = useRef();
  const { dataH } = useDataData();
  let dato1 = [];
  //console.log("dataH", dataH.shipping ? dataH.shipping[0].properties : "no data");
  const shipping = dataH.shipping ? dataH.shipping[0] : "no data";
  const shippingP = shipping ? shipping.properties : "no data";


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
    <div className={formStep === 4 ? styles.showForm : styles.hideForm}>
      <div className="mb-10 text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
        {shippingP
          ? datosShipping.push(
              shippingP.Tipo_de_Despacho,
              shippingP.Fecha_de_Despacho_o_Retiro,
              shippingP.Nombre_Retira,
              shippingP.Rut_Retira,
              shippingP.Observación,
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
            {datosShipping.map(
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
          {Data.Datas[6].map(
            (data, index) => (
              console.log("Esto es la data de shipping: ", data),
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
          {datosShipping.map(
            (datos, Bill) => (
              shippingInfo.push(datos),
              (
                // console.log("referencai: " + shippingInfo + "{{{Contacto}}}")
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
