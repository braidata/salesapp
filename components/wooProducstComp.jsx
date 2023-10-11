import React, { useState, useEffect } from "react";

import axios from "axios";

import Image from "next/image";

import Products from "../components/buscaProduct";

export default function ProductsW() {

const [products, setProducts] = useState([]);
  const val = 102100600007;

  useEffect(() => {
    axios.get("/api/products").then((res) => {
      setProducts(res.data);
    });
  }, []);

  const enviarProductos = async () => {
    let url = `api/products`;
    axios
      .post(url, { first: first })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
    window.location = "/";
  };

  return (
    <div className="mt-24">
      <h1 className="text-4xl text-center">Productos</h1>
      <Products />

      {/* Table */}
      {products.map(
        (product) => (
          product.sku == val ? console.log(product.id) : console.log("no"),
          (
            <table className="table-auto mt-24">
              <caption className=" ">{product.name}</caption>
              <thead>
                <tr>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Precio</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2">Sizes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2"> {product.sku}</td>
                  <td className="border px-4 py-2">{product.name}</td>
                  <td className="border px-5 py-2">${product.price}</td>
                  <td
                    className="border px-4 py-2"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  ></td>
                  <Image src={product.images[0].src} width={500} height={500} />
                </tr>
              </tbody>
            </table>
          )
        )
      )}

      {/* //value finder form */}
      <form action="/api/products" method="POST">
        <input type="text" name="first" />
        <buttom type="submit" value="Submit" />
      </form>
    </div>
  );

}

// Compare this snippet from pages\index.jsx: