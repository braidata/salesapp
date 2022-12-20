//nextjs taiwind count id number generator component

import React from "react";
import { useState } from "react";

export default function CountIdGenerator() {

    const [count, setCount] = useState(0);
    
    return (
        <div className="flex flex-col justify-center items-center">
        <button
            className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onClick={() => setCount(count + 1)}
        >
            {count}
        </button>
        </div>
    );
    }
