//nextjs tailwind order table editing component

import React from 'react'

const OrderTableBig = ({order, setOrder}) => {

    const handleChange = (e) => {
        setOrder({
            ...order,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="flex flex-col justify-center items-center">
            <div className="flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
                <p className="text-gray-500">We'd love to hear from you</p>
            </div>
            <div className="flex flex-col justify-center items-center">
                <form className="flex flex-col justify-center items-center">
                    <div className="flex flex-col justify-center items-center">
                        <label className="text-gray-500">Name</label>
                        <input className="border-2 border-gray-300 p-2 rounded-md" type="text" name="name" value={order.name} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <label className="text-gray-500">Email</label>
                        <input className="border-2 border-gray-300 p-2 rounded-md" type="email" name="email" value={order.email} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <label className="text-gray-500">Message</label>
                        <textarea className="border-2 border-gray-300 p-2 rounded-md" name="message" id="message" cols="30" rows="10" value={order.message} onChange={handleChange}></textarea>
                    </div>
                    <button className="bg-blue-500 text-white p-2 rounded-md">Submit</button>
                </form>
            </div>
        </div>
        
    )
}

export default OrderTableBig
