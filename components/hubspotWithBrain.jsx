import React, { useState, useEffect } from 'react';
import axios from 'axios';
  
   


export default function HubspotWithBrain(e) {

    const email = e.target.value
    
  // Realizamos una solicitud GET a la API de HubSpot para buscar un contacto por correo electrónico
  async function getContactByEmail(email) {
    const url = `https://api.hubapi.com/contacts/v1/contact/email/${email}/profile?hapikey=${process.env.APP_KEY}`;
    const { data } = await axios.get(url);
    return data;
  }

  // Realizamos una solicitud GET a la API de HubSpot para obtener la lista de negocios asociados a un contacto
  async function getDealsByContact(contactId) {
    const url = `https://api.hubapi.com/deals/v1/deal/associated/contact/${contactId}/paged?hapikey=${process.env.APP_KEY}`;
    const { data } = await axios.get(url);
    return data;
  }

  // Realizamos una solicitud GET a la API de HubSpot para obtener la lista de productos asociados a un negocio
  async function getProductsByDeal(dealId) {
    const url = `https://api.hubapi.com/crm-objects/v1/objects/products/associated/deal/${dealId}?hapikey=${process.env.APP_KEY}`;
    const { data } = await axios.get(url);
    return data;
  }

  // La función useEffect se ejecutará cada vez que se realice una solicitud a la API de HubSpot
  // y se reciba una respuesta con los nuevos datos
  useEffect(() => {
    // Primero buscamos el contacto por correo electrónico
    getContactByEmail(email).then((contact) => {
      // Luego obtenemos la lista de negocios asociados a ese contacto
      getDealsByContact(contact.vid).then((deals) => {
        // Filtrar la lista de negocios por los seleccionados por el usuario
        const filteredDeals = deals.filter((deal) => selectedDeals.includes(deal.dealId));

        // Finalmente, obtenemos la lista de productos asociados a cada negocio
        Promise.all(
          filteredDeals.map(async (deal) => {
            const products = await getProductsByDeal(deal.dealId);
            return products;
          })
        ).then((products) => {
          // Creamos un objeto JSON con toda la información
          const data = {
            contact,
            deals: filteredDeals,
            products,
          };

          // Actualizamos el estado del componente con los nuevos datos
          setData(data);
        });
      });
    });
  }, [email, selectedDeals]);





  return (
    <div>
      {/* Formulario para ingresar el correo electrónico del usuario */}
      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="email">
          Correo electrónico:
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit">Buscar contacto</button>
      </form>

      {/* Si se ha encontrado un contacto, mostramos la lista de negocios asociados */}
      {data.contact && (
        <div>
          <h3>Negocios asociados a {data.contact.properties.email.value}</h3>
          <ul>
            {data.deals.map((deal) => (
              <li key={deal.dealId}>
                <label htmlFor={`deal-${deal.dealId}`}>
                  <input
                    id={`deal-${deal.dealId}`}
                    type="checkbox"
                    checked={selectedDeals.includes(deal.dealId)}
                    onChange={(e) =>
                      e.target.checked
                        ? setSelectedDeals([...selectedDeals, deal.dealId])
                        : setSelectedDeals(selectedDeals.filter((id) => id !== deal.dealId))
                    }
                  />
                  {deal.properties.dealname.value}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Si se han seleccionado negocios, mostramos la lista de productos asociados a cada uno */}
      {data.products.length > 0 && (
        <div>
          <h3>Productos asociados a los negocios seleccionados</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre del producto</th>
                <th>Precio unitario</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
                {data.products.map((products, index) => (
                    <React.Fragment key={index}>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.properties.productname.value}</td>
                                <td>{product.properties.unitprice.value}</td>
                                <td>{product.properties.quantity.value}</td>
                                <td>{product.properties.subtotal.value}</td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
            </tbody>
            </table>
        </div>
        )}
    </div>
    );
                        }







