//footer with submit input and social media links

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const newFooter = () => {

    return (

        <div className="flex flex-row justify-center items-center">
            {/* <div className="flex flex-row justify-center items-center">
                <Link href="/">
                    <p className="text-white p-2">Inicio</p>
                </Link>
                <Link href="/forms">
                    <p className="text-white p-2">Crear Orden</p>
                </Link>
                <Link href="/dashboard">
                    <p className="text-white p-2">Dashboard</p>
                </Link>
                <Link href="/probahub">
                    <p className="text-white p-2">API HubSpot</p>
                </Link>
                <Link href="/wooProducts">
                    <p className="text-white p-2">Productos</p>
                </Link>
                {/* login 
                <Link href="/login">
                    <p className="text-white p-2">Ingresar</p>
                </Link>
                
            </div> */}

            <div className="flex flex-row justify-center items-center">
                <Link href="https://www.facebook.com/">
                    <p className="text-white p-2">Facebook</p>
                </Link>
                <Link href="https://www.instagram.com/">
                    <p className="text-white p-2">Instagram</p>
                </Link>
                <Link href="https://twitter.com/">
                    <p className="text-white p-2">Twitter</p>
                </Link>
                <Link href="https://www.youtube.com/">
                    <p className="text-white p-2">YouTube</p>
                </Link>
            </div>
            <div className="flex flex-row justify-center items-center">
                <p className="text-white p-2">Contacto</p>
            </div>
            <div className="flex flex-row justify-center items-center">
                <Link href="https://api.whatsapp.com/send?phone=5491164444888&text=Hola!%20Quisiera%20saber%20m%C3%A1s%20sobre%20Ventus%20Sales">
                    <p className="text-white p-2">+569 666 77 849</ p>
                </Link>
                <Link href="mailto:braidata@gmail.com">
                    <p className="text-white p-2"> Correo </p>
                        </Link>

            </div>
            <div className="flex flex-row justify-center items-center">
                <p className="text-white p-2">© 2022 Ventus Sales</p>
            </div>
        </div>
    )
}

export default newFooter



