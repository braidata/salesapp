// text block component

import React from 'react'

const TextBlock = ({title, subtitle, text}) => {
    return (
        <div className="">
            <div className="bg-blue-500  text-center">
                <h1 className="text-2xl font-bold">{title}</h1>
                < h2 className="text-xl font-light">{subtitle}</h2>
                <p className="text-sm">{text}</p>
            </div>
        </div>
    
    )
}

export default TextBlock

