//spinner button nextjs tailwind

import React from "react";

export default function SpinnerButton ({texto})  {

    return (
        
        //spinner button+icon
<div className="flex justify-center items-center mt-8">
              <svg
                className="animate-spin h-5 w-5 mr-3 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              <span className="text-gray-500 dark:text-gray-400">
                {texto}
              </span>
            </div>
    );
}