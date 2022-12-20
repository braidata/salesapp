//nextjs tailwind login

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

const Login = () => {

    //login
    const router = useRouter()
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(email, password)
        router.push('/')
    }

    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <div className="flex flex-col justify-center items-center bg-white w-96 h-96 rounded-xl shadow-lg">
                <div className="flex flex-col justify-center items-center">
                    <Image src="/logo-ventus.png" width={100} height={100} />
                    <h1 className="text-2xl font-bold text-gray-900">Ventus Sales</h1>
                </div>
                <form className="flex flex-col justify-center items-center mt-10" onSubmit={handleSubmit}>
                    <input type="email" placeholder="Correo" className="border-2 border-gray-300 p-2 rounded-lg w-80 mb-5" onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Contraseña" className="border-2 border-gray-300 p-2 rounded-lg w-80 mb-5" onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit" className="bg-gray-900 text-white p-2 rounded-lg w-80">Ingresar</button>
                </form>
            </div>
        </div>
    )
}

export default Login

