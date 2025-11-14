// Tipos basados en la documentación de Home Delivery.
// Simplificados para usar como referencia en Ventus.

export interface HdDireccionEnvio {
  direccion_destinatario: string;
  ubigeo_destinatario: string;
  latitud_destinatario?: string | null;
  longitud_destinatario?: string | null;
  referencia_destinatario: string;
  comentario: string;
}

export interface HdCliente {
  nombre_destinatario: string;
  ruc_dni_destinatario: string;
  telefono_destinatario: string;
  email_destinatario: string;
}

export interface HdDetalleItem {
  alto: string;
  peso: string;
  ancho: string;
  largo: string;
  talla: string;
  unidad: number;
  skuDesc: string;
  valorRecaudo: string;
  codigoProducto: string;
  valorDeclarado: string;
  pesoVolumetrico: string;
}

export interface HdPedidoInfo {
  orden_compra: string;
  lpn: string;
  promesa_despacho: string | Date; // YYYY-MM-DD
  promesa_entrega: string | Date;  // YYYY-MM-DD
  valor_declarado: string;
  canal_venta: string;
  detalle: HdDetalleItem[];
}

export interface HdCreateOrderPayload {
  direccion_origen_id: number;
  direccion_envio: HdDireccionEnvio;
  cliente: HdCliente;
  pedido: HdPedidoInfo;
}

export interface HdBasicResponse {
  success?: boolean;
  message?: string;
  [key: string]: any;
}
