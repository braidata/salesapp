//nextjs tailwind text block with title and description

import React from 'react'

const Text = ({title, description}) => {
    return (
        <div className="flex flex-col justify-center items-center  mt-10 mb-10">
            <div className="flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-300 mb-5">{title}</h1>
                <p className="text-justify text-gray-700 dark:text-gray-300 w-96 mb-5">{description}</p>
            </div>
        </div>
    )
}

export default Text
