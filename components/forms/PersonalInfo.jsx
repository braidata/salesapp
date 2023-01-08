import { useRef } from "react";
import styles from "../../styles/styles.module.scss";
import { Form } from "@unform/web";
import Input from "../Input Fields/Input";
import { useFormData } from "../../context";
import * as yup from "yup";
import Datas from "../../lib/data";
import { useDataData } from "../../context/data";
import { validateRUT, getCheckDigit, generateRandomRUT } from "validar-rut";

const datosContacto = [];
const contactInfo = [];
const schema = yup.object().shape({
  //array
  contact: yup.object().shape({
    Email: yup.string().email().required("Email is required"),
    Nombre: yup
      .string()
      .min(2, "Ingresa un Nombre válido")
      .required("Nombre es obligatorio"),
      DealId: yup
      .string()
      .min(2, "Ingresa un Nombre válido")
      .required("Nombre es obligatorio"),
    Apellido: yup
      .string()
      .min(2, "Ingresa un apellido válida")
      .required("Apellido es obligatorio"),
    Rut: yup
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
    Telefono: yup
      .string()
      .min(9, "Ingresa un teléfono válido")
      .required("Teléfono es obligatorio"),
  }),
});

export default function PersonalInfo({ formStep, nextFormStep }) {
  const Data = Datas;
  const { setFormValues } = useFormData();
  const formRef = useRef();
  const { dataH } = useDataData();
  let dato1 = [];
  // const contactos = dataH.contacts ? dataH.contacts[0] : "no data";
  // const contactosP = contactos ? contactos.properties : "no data";

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
    <div className={formStep === 0 ? styles.showForm : styles.hideForm}>
      <div className="mb-10 text-gray-100 dark:text-gray-400 max-h-0 max-w-0">
        {/* {contactosP != null
          ? datosContacto.push(
              contactosP.rut,
              contactosP.firstname,
              contactosP.lastname,
              contactosP.email,
              contactosP.mobilephone
            )
          : "No Data"} */}
      </div>

      <h2 className="mt-2 border rounded-md border-gray-500 bg-gray-200 dark:bg-gray-700 p-2.5 text-gray-200 text-center text-xl dark:text-gray-100">
        INFORMACIÓN DEL CONTACTO
      </h2>

      <Form ref={formRef} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          {/* Tailwind forom Card */}
          {/* Datas contiene info para generar formularios */}
          <div className="invisible text-gray-100 dark:text-gray-400 max-h-8 max-w-0">
            {/* {datosContacto.length >= 5
              ? datosContacto.map((datos) =>
                  datos != null ? dato1.push(datos) : "no info"
                )
              : "no data"} */}
          </div>{" "}
          {Data != null
            ? Data.Datas[0].slice(0, 6).map((data, index) => (
                // call internal api
                <Input
                  key={index}
                  name={data.campo}
                  label={data.detalle}
                  type={data.type}
                  valua={data.valua}
                />
              ))
            : "no data"}
          <button className="mt-2 mb-5 bg-blue-900/90 border border-gray-300 text-gray-900 text-sm rounded-lg hover:bg-blue-800/90 focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" type="submit">Siguiente</button>
        </div>
      </Form>
    </div>
  );
}
