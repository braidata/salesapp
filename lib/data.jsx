let rut = "23157989-3";

const campos3 = [
  { campo: "shippingAddress.Calle", type: "street", detalle: "Calle de Envío", valua: "El Gato Campestre" },
  { campo: "shippingAddress.Numero", type: "text", detalle: "Numero de Envío", valua: "15487" },
  { campo: "shippingAddress.Casa_o_depto", type: "text", detalle: "Casa o depto de Envío", valua: "1100" },
  { campo: "shippingAddress.Comuna", type: "town", detalle: "Comuna de Envío", valua: "Antofagasta" },
  { campo: "shippingAddress.Región", type: "state", detalle: "Región de Envío", valua: "Antofagasta" },
  { campo: "shippingAddress.Ciudad", type: "city", detalle: "Ciudad de Envío", valua: "Antofagasta" },
  {
    campo: "shippingAddress.Código_Postal",
    type: "text",
    detalle: "Código Postal de Envío",
    valua: "120123"
  },
  { campo: "shipping.Tipo_de_Despacho", type: "text", detalle: "Tipo de Despacho", valua: "Envío Región FedEx" },
  { campo: "shipping.Fecha_de_Despacho_o_Retiro", type: "date", detalle: "Fecha de Retiro o Despacho", valua: "22-12-2022" },
  { campo: "shipping.Nombre_Retira", type: "text", detalle: "Nombre de Retira", valua: "Carlos Espinoza" },
  { campo: "shipping.Rut_Retira", type: "text", detalle: "Rut de Retira", valua: "15020576k" },
  { campo: "shipping.Observación", type: "text", detalle: "Observación", valua: "Dejar en la el local azúl de enfrente, Preguntar por Yolanda" },
];

//tipo de despacho
//fecha de despacho o retiro
// datos de retira rut nombre patente
//crear campo flete en negocio
//observacion

const campos2 = [
  // {
  //   campo: "billing.Tipo_de_DTE",
  //   type: "text",
  //   detalle: "Ingresa el tipo DTE",
  //   valua: "Factura",
  // },
  {
    campo: "billing.Razón_Social",
    type: "text",
    detalle: "Ingresa la Razón Social",
    valua: "Fabrica de Chivitos",
  },
  {
    campo: "billing.Rut_Empresa",
    type: "text",
    detalle: "Ingresa tu Rut de Empresa",
    valua: "966848502",
  },
  {
    campo: "billing.Giro",
    type: "text",
    detalle: "Ingresa tu Giro",
    valua: "Sanguchería",
  },
];
const campos1 = [
  { campo: "contact.Rut", type: "text", detalle: "Rut del cliente", valua: `${rut}` },
  {
    campo: "contact.Nombre",
    type: "text",
    detalle: "Nombre del cliente",
    valua: "Juan Ramón",
  },
  {
    campo: "contact.Apellido",
    type: "text",
    detalle: "Apellido del cliente",
    valua: "Perez Carvajal",
  },
  {
    campo: "contact.Email",
    type: "email",
    detalle: "Email del cliente",
    valua: "elloropablo@gmail.com",
  },
  {
    campo: "contact.Telefono",
    type: "phone",
    detalle: "Telefono del cliente",
    valua: "+56987654321",
  },
];
const dirFac1 = [
  {
    campo: "billingAddress.Calle",
    type: "street",
    detalle: "Calle de Facturación",
    valua: "El Sultán de Berlín",
  },
  {
    campo: "billingAddress.Número",
    type: "text",
    detalle: "Número de Dirección Facturación",
    valua: "7666",
  },
  {
    campo: "billingAddress.Departamento",
    type: "text",
    detalle: "Casa o depto de Facturación",
    valua: "777",
  },
  {
    campo: "billingAddress.Región",
    type: "state",
    detalle: "Región de Facturación",
    valua: "Metropolitana",
  },
  {
    campo: "billingAddress.Ciudad",
    type: "city",
    detalle: "Ciudad de Facturación",
    valua: "Santiago de Chile",
  },
  {
    campo: "billingAddress.Comuna",
    type: "town",
    detalle: "Comuna de Facturación",
    valua: "Providencia",
  },
  {
    campo: "billingAddress.Código_Postal",
    type: "text",
    detalle: "Código Postal de Facturación",
    valua: "750123",
  },
];
const dirEnv1 = [
  { campo: "shippingAddress.Calle", type: "street", detalle: "Calle de Envío", valua: "El Gato Campestre" },
  { campo: "shippingAddress.Numero", type: "text", detalle: "Numero de Envío", valua: "15487" },
  { campo: "shippingAddress.Casa_o_depto", type: "text", detalle: "Casa o depto de Envío", valua: "1100" },
  { campo: "shippingAddress.Comuna", type: "town", detalle: "Comuna de Envío", valua: "Antofagasta" },
  { campo: "shippingAddress.Región", type: "state", detalle: "Región de Envío", valua: "Antofagasta" },
  { campo: "shippingAddress.Ciudad", type: "city", detalle: "Ciudad de Envío", valua: "Antofagasta" },
  {
    campo: "shippingAddress.Código_Postal",
    type: "text",
    detalle: "Código Postal de Envío",
    valua: "120123"
  },
];
const products1 = [
  { campo: "products.SKU", type: "text", detalle: "SKU", valua: "103011100044" },
  { campo: "products.Nombre_Producto", type: "text", detalle: "Nombre", valua: "HORNO VHG DE 1 CÁMARA GAS" },
  { campo: "products.Precio", type: "text", detalle: "Precio", valua: "299990" },
  { campo: "products.Cantidad", type: "text", detalle: "Cantidad", valua: "15" },
  { campo: "products.Flete", type: "text", detalle: "Flete", valua: "15990" },
];
const pago1 = [
  {
    campo: "payment.Metodo_de_Pago",
    type: "text",
    detalle: "Metodo de Pago",
  valua: "Transbank"
  },
  {
    campo: "payment.Código_de_Autorización",
    type: "text",
    detalle: "Código de Autorización",
  valua: "66677"
  },
  {
    campo: "payment.Cantidad_de_Pagos",
    type: "number",
    detalle: "Cantidad de Pagos",
  valua: "6"
  },
  {
    campo: "payment.Monto_de_Pagos",
    type: "number",
    detalle: "Monto del Pago",
  valua: "296990"
  },
  {
    campo: "payment.Fecha_de_Pago",
    type: "date",
    detalle: "Fecha",
  valua: "22-12-2022"
  },
];

const Datas = [campos1, dirFac1, dirEnv1, products1, pago1, campos2, campos3];

export default { Datas };
