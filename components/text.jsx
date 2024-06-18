//nextjs tailwind text block with title and description

import React from 'react'

const Text = ({title, description, classe}) => {
    return (
        <div className={`flex flex-col justify-center items-center  mt-10 mb-2`}>
            <div className="flex flex-col justify-center items-center">
                <h1 className={`flex flex-col justify-center items-center  mt-10 mb-2 ${classe}`}>{title}</h1>
                <h2 className="text-justify font-bold  text-gray-700 dark:text-gray-300 w-96 mb-2">{description}</h2>
            </div>
        </div>
    )
}

export default Text
