//nextjs tailwind footer coponent

import React from "react";
import Link from "next/link";
import { Dropdown } from "flowbite-react";

const Footer = () => {
  //footer links
  const links = [
    {
      name: "Inicio",
      path: "/",
    },
    {
      name: "Crear Orden",
      path: "/forms",
    },
    {
      name: "Dashboard",
      path: "/dashboard",
    },
  ];

  return (
    //  footer styled with tailwindcss
    <footer className="flex flex-row justify-center items-center bg-gray-900 p-2 mt-24 w-full">
      <div className="flex flex-row justify-center items-center w-full">
        <h1 className="text-2xl font-bold text-white">Ventus Sales</h1>
      </div>

      {/* <Dropdown  className="hidden bg-gray-900/5" label="Herramientas" dismissOnClick={"false"} inline={false}>
        
        {links.map((link, index) => (
            
          <Dropdown.Item  className="bg-gray-900/75" key={index} >
            <Link href={link.path} className="text-white p-2">
              {link.name}
            </Link>
          </Dropdown.Item>
        ))}
      </Dropdown> */}
      
      {/* <div className="flex flex-row justify-center items-center bg-gray-100">
            <div className="flex flex-row justify-center items-center">
                <h1 className="text-3xl font-bold text-gray-900">Footer</h1>
                <p className="text-gray-500">This is the footer</p>
            </div> */}

      {/* social networks */}
      {/* <div className="flex flex-row justify-center items-center">
        <a
          href="https://www.facebook.com"
          target="_blank"
          className="flex flex-row justify-center items-center bg-blue-500 text-white mt-5 ml-2 p-2 rounded-md"
        >
          Facebook
        </a>
        <a
          href="https://www.twitter.com"
          target="_blank"
          className="flex flex-row justify-center items-center bg-blue-500 text-white mt-5 ml-2 p-2 rounded-md"
        >
          Twitter
        </a>
        <a
          href="https://www.instagram.com"
          target="_blank"
          className="flex flex-row justify-center items-center bg-blue-500 text-white mt-5 ml-2 p-2 rounded-md"
        >
          Instagram
        </a>
      </div> */}
      {/* subscribe */}
      <div className="flex flex-col justify-center items-center ml-12 w-full">
        <p className="text-gray-500 w-full">Subscribe to our newsletter</p>

        <div className="flex flex-row justify-center items-center">
          <form className="flex flex-row justify-center items-center">
            <div className="flex flex-row justify-center items-center">
              <label className="text-gray-500">Email</label>
              <input
                className="border-2 border-gray-300 p-2 rounded-md"
                type="email"
                name="email"
              />
            </div>
            <button className="bg-blue-500 text-white p-2 rounded-md">
              Submit
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
