import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

const StockTable = ({ data }) => {
    const [selectedRow, setSelectedRow] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (parseInt(a[sortConfig.key]) < parseInt(b[sortConfig.key])) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (parseInt(a[sortConfig.key]) > parseInt(b[sortConfig.key])) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleCopyToClipboard = () => {
        if (selectedRow === null) return;

        const row = data[selectedRow];
        const headers = "Material\tNombre\tCentro\tAlmacen\tStock Total\tStock Disp.\tStock Comp.\n";
        const values = `${parseInt(row.Material)}\t${row.MaterialName}\t${parseInt(row.werks)}\t${parseInt(row.lgort)}\t${parseInt(row.labst)}\t${parseInt(row.stock_disp)}\t${parseInt(row.stock_Comp)}`;
        const rowString = headers + values;
        navigator.clipboard.writeText(rowString);
        // alert('Copiado al portapapeles');
    };



    const handleDownloadExcel = () => {
        const filteredData = data.map(row => ({
            Material: parseInt(row.Material),
            Nombre: row.MaterialName,
            Centro: parseInt(row.werks),
            Almacen: parseInt(row.lgort),
            "Stock Total": parseInt(row.labst),
            "Stock Disp.": parseInt(row.stock_disp),
            "Stock Comp.": parseInt(row.stock_Comp)
        }));

        const ws = XLSX.utils.json_to_sheet(filteredData, { header: ["Material", "Nombre", "Centro", "Almacen", "Stock Total", "Stock Disp.", "Stock Comp."], skipHeader: false });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'StockData');
        XLSX.writeFile(wb, 'stock_data.xlsx');
    };


    return (
        <div>

            <div className='flex flex-col md:flex-row justify-end gap-2 mt-2 mb-4'>

                {sortedData !== null && <button onClick={handleDownloadExcel} className="rounded-lg bg-green-300/30 dark:bg-green-700/30 text-green-800 dark:text-green-100/80 font-semibold leading-none hover:text-green-200 hover:bg-green-300/50 drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:hover:bg-green-400/30 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]">Descargar Excel</button>}
                {selectedRow !== null && (
                    <button onClick={handleCopyToClipboard} aria-label="copy" className="rounded-lg bg-teal-300/30 dark:bg-teal-700/30 text-teal-800 dark:text-green-100/80 font-semibold leading-none hover:text-teal-200 hover:bg-teal-300/50 drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:hover:bg-teal-400/30 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]">Copiar Seleccionado</button>
                )}
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="min-w-full divide-y divide-gray-200 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('Material')} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer rounded-tl-md">
                                Material
                            </th>
                            <th onClick={() => requestSort('MaterialName')} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer">
                                Nombre
                            </th>
                            <th onClick={() => requestSort('werks')} className="hidden md:flex px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer">
                                Centro
                            </th>
                            <th onClick={() => requestSort('lgort')} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer">
                                Almacén
                            </th>
                            <th onClick={() => requestSort('labst')} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer">
                                Stock Total
                            </th>
                            <th onClick={() => requestSort('stock_disp')} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer">
                                Stock Dispo.
                            </th>
                            <th onClick={() => requestSort('stock_Comp')} className="hidden md:flex px-6 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer rounded-tr-lg">
                                Stock Comp.
                            </th>
                            {/* Añade más encabezados de columnas según tus datos */}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                        {sortedData.map((row, index) => (
                            <tr key={index} onClick={() => setSelectedRow(index)} className={selectedRow === index ? 'bg-gray-300 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}>
                                <td className="px-6 py-4 text-right whitespace-nowrap">{parseInt(row.Material)}</td>
                                <td className="px-6 py-4 text-left whitespace-nowrap">{row.MaterialName}</td>
                                <td className="hidden md:block px-6 py-4 text-right whitespace-nowrap">{parseInt(row.werks)}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">{parseInt(row.lgort)}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">{parseInt(row.labst)}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">{parseInt(row.stock_disp)}</td>
                                <td className="hidden md:block px-6 py-4 text-right whitespace-nowrap">{parseInt(row.stock_Comp)}</td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockTable;