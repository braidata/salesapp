import React, { useState } from 'react';

const FilterComponent = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({
    orderId: '',
    status: '',
    companyName: '',
    sap: '',
    hubspot: ''
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const clearFilter = (filterName) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: ''
    }));
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    setActiveFilter(null); // Close any active filter input when closing modal
  };

  return (
    <div>
      <button 
        onClick={toggleModal} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Filtros
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-11/12 md:w-1/2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filtros</h2>
              <button 
                onClick={toggleModal} 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-4">
              {['orderId', 'status', 'companyName', 'sap', 'hubspot'].map(filter => (
                <div key={filter} className="mb-2">
                  <button 
                    onClick={() => setActiveFilter(filter)} 
                    className={`block w-full text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${activeFilter === filter ? 'font-bold' : ''}`}>
                    {`Filtrar por ${filter}`}
                  </button>
                  {activeFilter === filter && (
                    <div className="relative mt-2">
                      <input
                        type="text"
                        placeholder={`Filtrar por ${filter}`}
                        value={filters[filter]}
                        onChange={(e) => handleFilterChange(filter, e.target.value)}
                        className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      />
                      {filters[filter] && (
                        <button
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-900 dark:text-gray-300 font-bold rounded-lg hover:text-gray-900 dark:hover:text-white transition duration-500 ease-in-out"
                          onClick={() => clearFilter(filter)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterComponent;
