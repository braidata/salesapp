//nextjs tailwind form component

import React from 'react'
import AtomForm from '../components/atomForm'


export default function Form  ({campos})  {
    return (
        
        <div className="flex flex-col justify-center items-center mt-20">
            <div className="flex flex-col justify-center items-center">

            </div>
            <div className="flex flex-col justify-center items-center">
           {campos.map((campo, index) => (
            console.log(campo),
            <AtomForm key={index} campo={campo.campo} detalle={campo.detalle} type={campo.type} />
                // <AtomForm campo={campo} detalle={detalle}/>
            ))}
                
            </div>
        </div>
        

    )
}



/**
 * 
 * Vendedor logeado con la clave.

•	N° Pedido Interno
•	Rut
•	Nombre 
•	Giro
•	Correo Electrónico:
•	Celular: 
•	Contacto:

•	Dirección:

o	Calle
o	Numero
o	Casa o depto.
o	Comuna
o	Región
o	Ciudad
o	Código Postal

•	Dirección despacho:

o	Calle
o	Numero
o	Casa o depto.
o	Comuna
o	Región
o	Ciudad
o	código Postal





Detalle de la compra:

Factura o Boleta

SKU        Nombre SKU     Unidad medida       Cantidad         Precio       Sub – total
1
2
3
4
5
6
7
8
9
10
11
12

Total General

Fecha de entrega

Si retira:   Rut y Nombre   de la persona que retira  , patente del vehículo.

Observación:  ……………………………………

Forma de despacho :   Fedex- Starken – retiro en bodega -  etc, etc, etc

Forma de Pago:
•	Credito
•	contado
•	Tarjeta de crédito 
•	Debido
•	Transferencia:  1 o Mas detallar. ¿???????
•	Etc.
Los créditos o tarjetas deben llevar N° autorización y cantidad de cuotas.


Desarrollo de la venta:
•	N° pedido SAP
•	N° DTE 
•	Despacho: fecha
•	Vía despacho:  por donde se despacho
•	OT  del despachador Logístico.



Nota:

•	Maestros

o	Cliente
o	Productos
o	Lista de Precio
o	Vincular directo a los Stock

 * 
 */


