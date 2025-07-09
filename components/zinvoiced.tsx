import React, { useState } from 'react';
import { Search, Download, Trash2, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import BotonFactura from './zDte';
import BotonEtiqueta from './zStarken';
import ZStarken from './zStarken';

interface OrderItem {
 sku: string;
 name: string;
 quantity: number;
 amount: string | number;
}

interface ProcessedOrder {
 referencia: string;
 documentoSAP: string;
 sapOrder: string;
 customer: string;
 status: string;
 totalAmount: number;
 fecha: string;
 febosFC: string;
 documentType: string;
 documentTypeText: string;
 apiStatus: 'success' | 'error';
 items?: OrderItem[];
}

interface SAPApiResponse {
 success: boolean;
 data: Array<{
   purchaseOrder: string;
   sapOrder: string;
   creationDateFormatted: string;
   customer: string;
   deliveryStatus: string;
   billingStatus: string;
   status: string;
   statusCode: string;
   totalAmount: number;
   document: string;
   febosFC: string;
   documentType: string;
   documentTypeText: string;
   items: OrderItem[];
 }>;
}

const SAPDocumentFetcher: React.FC = () => {
 const [inputData, setInputData] = useState<string>(`1537670509513-01
1537370509401-01
1537180509063-01
1537160508971-01
1537150508901-01`);
 
 const [processedData, setProcessedData] = useState<ProcessedOrder[]>([]);
 const [isProcessing, setIsProcessing] = useState(false);
 const [progress, setProgress] = useState({ current: 0, total: 0 });

 const processData = async () => {
   const lines = inputData.split('\n').map(line => line.trim()).filter(line => line);
   
   // Filtrar solo las líneas que empiecen con "15"
   const validReferences = lines.filter(line => line.startsWith('15'));
   
   if (validReferences.length === 0) {
     alert('No se encontraron referencias válidas (que empiecen con "15").');
     return;
   }
   
   setIsProcessing(true);
   setProgress({ current: 0, total: validReferences.length });
   const results: ProcessedOrder[] = [];
   
   for (let i = 0; i < validReferences.length; i++) {
     const referencia = validReferences[i];
     
     try {
       // Usando proxy público para evitar CORS
       const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
         `https://test-ventus-sales.ventuscorp.cl/api/apiSAPSalesEcommerce?limit=100&purchaseOrder=${referencia}`
       )}`;
       
       const response = await fetch(proxyUrl);
       const proxyData = await response.json();
       
       if (proxyData.status?.http_code === 200 && proxyData.contents) {
         const data: SAPApiResponse = JSON.parse(proxyData.contents);
         
         if (data.success && data.data && data.data.length > 0) {
           const order = data.data[0];
           results.push({
             referencia: referencia,
             documentoSAP: order.document || 'N/A',
             sapOrder: order.sapOrder || 'N/A',
             customer: order.customer || 'N/A',
             status: order.status || 'N/A',
             totalAmount: order.totalAmount || 0,
             fecha: order.creationDateFormatted || 'N/A',
             febosFC: order.febosFC || 'N/A',
             documentType: order.documentType || 'N/A',
             documentTypeText: order.documentTypeText || 'N/A',
             apiStatus: 'success',
             items: order.items || []
           });
         } else {
           results.push({
             referencia: referencia,
             documentoSAP: 'No encontrado',
             sapOrder: 'N/A',
             customer: 'N/A',
             status: 'Sin datos',
             totalAmount: 0,
             fecha: 'N/A',
             febosFC: 'N/A',
             documentType: 'N/A',
             documentTypeText: 'N/A',
             apiStatus: 'error'
           });
         }
       } else {
         results.push({
           referencia: referencia,
           documentoSAP: 'Error API',
           sapOrder: 'N/A',
           customer: 'N/A',
           status: 'Error de respuesta',
           totalAmount: 0,
           fecha: 'N/A',
           febosFC: 'N/A',
           documentType: 'N/A',
           documentTypeText: 'N/A',
           apiStatus: 'error'
         });
       }
     } catch (error) {
       console.error(`Error procesando ${referencia}:`, error);
       results.push({
         referencia: referencia,
         documentoSAP: 'Error de conexión',
         sapOrder: 'N/A',
         customer: 'N/A',
         status: 'Error',
         totalAmount: 0,
         fecha: 'N/A',
         febosFC: 'N/A',
         documentType: 'N/A',
         documentTypeText: 'N/A',
         apiStatus: 'error'
       });
     }
     
     setProgress({ current: i + 1, total: validReferences.length });
     
     // Pausa para no sobrecargar
     await new Promise(resolve => setTimeout(resolve, 1600));
   }
   
   setProcessedData(results);
   setIsProcessing(false);
 };

 const clearData = () => {
   setInputData('');
   setProcessedData([]);
   setProgress({ current: 0, total: 0 });
 };

 const exportToCSV = () => {
   if (processedData.length === 0) {
     alert('No hay datos para exportar.');
     return;
   }
   
   const headers = ['Referencia Cliente', 'Documento SAP', 'Orden SAP', 'Cliente'];
   const csvContent = [
     headers.join(','),
     ...processedData.map(item => [
       item.referencia,
       item.documentoSAP,
       item.sapOrder,
       item.customer,
       `"${item.status}"`,
       item.totalAmount || 0,
       item.fecha,
       item.febosFC,
       `"${item.documentTypeText}"`,
       item.apiStatus
     ].join(','))
   ].join('\n');
   
   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
   const link = document.createElement('a');
   const url = URL.createObjectURL(blob);
   link.setAttribute('href', url);
   link.setAttribute('download', `documentos_sap_${new Date().toISOString().split('T')[0]}.csv`);
   link.style.visibility = 'hidden';
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
 };

 const successful = processedData.filter(item => item.apiStatus === 'success').length;
 const errors = processedData.filter(item => item.apiStatus === 'error').length;
 const totalAmount = processedData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

 return (
   <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
     {/* Animated background effects */}
     <div className="absolute inset-0 opacity-15">
       <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-slate-600/20 to-blue-800/20 rounded-full blur-3xl animate-pulse"></div>
       <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-900/20 to-slate-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-slate-700/20 to-blue-800/20 rounded-full blur-3xl animate-pulse delay-500"></div>
     </div>

     <div className="max-w-7xl mx-auto relative z-10">
       {/* Main glassmorphic container */}
       <div className="backdrop-blur-xl bg-slate-900/30 border border-slate-600/30 rounded-3xl shadow-2xl shadow-black/60 p-8 relative overflow-hidden">
         {/* Subtle inner glow */}
         <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 via-transparent to-blue-900/5 rounded-3xl"></div>
         
         {/* Header with neumorphic effect */}
         <div className="text-center mb-8 relative">
           <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl shadow-inner">
             <FileText className="w-6 h-6 text-slate-400" />
             <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-300 via-blue-200 to-slate-400 bg-clip-text text-transparent">
               SAP Document Fetcher
             </h1>
             <FileText className="w-6 h-6 text-blue-400" />
           </div>
           <p className="text-slate-400">Sistema de consulta de documentos SAP</p>
         </div>

         {/* Input Section - Neumorphic style */}
         <div className="mb-8">
           <label className="block text-sm font-semibold text-slate-300 mb-3 ml-1">
             Referencias de cliente (solo IDs que empiecen con "15"):
           </label>
           <div className="relative">
             <textarea
               value={inputData}
               onChange={(e) => setInputData(e.target.value)}
               className="w-full h-48 p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-600/40 rounded-2xl shadow-inner shadow-black/40 text-slate-200 placeholder-slate-400 font-mono text-sm resize-none transition-all duration-300 focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/20 focus:bg-slate-800/70"
               placeholder="Ejemplo:
1537670509513-01
1537370509401-01
1537180509063-01
1537160508971-01
..."
             />
             <div className="absolute inset-0 bg-gradient-to-br from-blue-800/5 via-transparent to-slate-700/5 rounded-2xl pointer-events-none"></div>
           </div>
         </div>

         {/* Neumorphic Buttons */}
         <div className="flex flex-wrap gap-4 mb-8">
           <button
             onClick={processData}
             disabled={isProcessing}
             className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-800/25 hover:shadow-xl hover:shadow-blue-700/40 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-blue-600/20 overflow-hidden"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             <Search className="w-5 h-5 relative z-10" />
             <span className="relative z-10">{isProcessing ? 'Procesando...' : 'Procesar Datos'}</span>
             {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10"></div>}
           </button>
           
           <button
             onClick={clearData}
             className="group relative flex items-center gap-3 px-8 py-4 bg-slate-700/60 hover:bg-slate-600/70 text-slate-200 font-semibold rounded-2xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-black/40 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 border border-slate-600/30 backdrop-blur-sm overflow-hidden"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             <Trash2 className="w-5 h-5 relative z-10" />
             <span className="relative z-10">Limpiar</span>
           </button>
           
           {processedData.length > 0 && (
             <button
               onClick={exportToCSV}
               className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-600 to-blue-700 hover:from-slate-500 hover:to-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-slate-700/25 hover:shadow-xl hover:shadow-blue-700/40 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 border border-slate-500/20 overflow-hidden"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               <Download className="w-5 h-5 relative z-10" />
               <span className="relative z-10">Exportar CSV</span>
             </button>
           )}
         </div>

         {/* Progress Bar - Glassmorphic */}
         {isProcessing && (
           <div className="mb-8 p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-2xl shadow-inner shadow-black/20">
             <div className="flex items-center justify-between mb-4">
               <span className="text-blue-300 font-semibold flex items-center gap-2">
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                 Procesando documentos...
               </span>
               <span className="text-slate-300 font-mono">{progress.current}/{progress.total}</span>
             </div>
             <div className="relative w-full h-3 bg-slate-700/60 rounded-full overflow-hidden shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-blue-600 via-slate-500 to-blue-700 transition-all duration-500 ease-out relative"
                 style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse"></div>
               </div>
             </div>
           </div>
         )}

         {/* Summary Cards - Neumorphic */}
         {processedData.length > 0 && (
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <div className="group p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               <div className="text-3xl font-bold text-blue-400 mb-2 relative z-10">{processedData.length}</div>
               <div className="text-sm text-slate-300 font-medium relative z-10">Total Procesados</div>
             </div>
             
             <div className="group p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               <div className="text-3xl font-bold text-slate-300 mb-2 relative z-10">{successful}</div>
               <div className="text-sm text-slate-300 font-medium relative z-10">Exitosos</div>
             </div>
             
             <div className="group p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-red-600/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-red-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               <div className="text-3xl font-bold text-red-400 mb-2 relative z-10">{errors}</div>
               <div className="text-sm text-slate-300 font-medium relative z-10">Con Errores</div>
             </div>
             
             <div className="group p-6 bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-2xl shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-blue-700/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-800/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               <div className="text-2xl font-bold text-blue-300 mb-2 relative z-10">${totalAmount.toLocaleString()}</div>
               <div className="text-sm text-slate-300 font-medium relative z-10">Monto Total</div>
             </div>
           </div>
         )}

         {/* Results Table - Glassmorphic */}
         {processedData.length > 0 && (
           <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-600/30 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="bg-slate-800/50 border-b border-slate-600/30">
                     {['ID VTEX', 'Documento SAP', 'Orden SAP', 'Cliente', 'Estado', 'Monto Total', 'Fecha', 'DTE', 'Tipo DTE', 'ESTADO API'].map((header, index) => (
                       <th key={index} className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                         {header}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700/20">
                   {processedData.map((item, index) => (
                     <tr key={index} className="hover:bg-slate-700/20 transition-all duration-200 group">
                       <td className="px-6 py-4 text-sm font-mono text-blue-300 bg-slate-800/20 group-hover:bg-slate-800/40 transition-colors duration-200">{item.referencia}</td>
                       <td className="px-6 py-4 text-sm font-bold text-blue-400">{item.documentoSAP != "N/A" ? item.documentoSAP : "sin DTE"}</td>
                       <td className="px-6 py-4 text-sm text-slate-300">{item.sapOrder != "N/A" ? item.sapOrder : "sin integrar"}</td>
                       <td className="px-6 py-4 text-sm text-slate-300">{item.customer != "N/A" ? item.customer : "sin cliente"}</td>
                       <td className="px-6 py-4 text-sm text-slate-300">{item.status != "N/A" ? item.status : "sin estado"}</td>
                       <td className="px-6 py-4 text-sm font-semibold text-blue-300">${(item.totalAmount || 0).toLocaleString() != "0" ? (item.totalAmount || 0).toLocaleString() : "sin monto"}</td>
                       <td className="px-6 py-4 text-sm text-slate-300">{item.fecha != "N/A" ? item.fecha : "sin fecha"}</td>
                       <td className="px-6 py-4 text-sm font-mono text-slate-400">{item.febosFC != "N/A" ? <BotonFactura febosId={item.febosFC}/> : "sin facturar"}</td>
                       <td className="px-6 py-4 text-sm text-slate-300">{item.documentTypeText != "N/A" ? item.documentTypeText : "sin DTE"}</td>
                       <td className="px-6 py-4 text-sm font-mono text-blue-300 bg-slate-800/20 group-hover:bg-slate-800/40 transition-colors duration-200">{item.referencia ? <ZStarken order={item.referencia} /> : "sin DTE"}</td>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           {item.apiStatus === 'success' ? (
                             <>
                               <CheckCircle className="w-4 h-4 text-slate-400" />
                               <span className="text-sm font-medium text-slate-300">Éxito</span>
                             </>
                           ) : (
                             <>
                               <XCircle className="w-4 h-4 text-red-400" />
                               <span className="text-sm font-medium text-red-400">Error</span>
                             </>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}
       </div>
     </div>
   </div>
 );
};

export default SAPDocumentFetcher;


// 1537040508711-01
// 1537140508937-01
// 1537150508945-01
// 1536930508529-01
// 1536890508337-01
// 1538330501247-01
// 1538210501241-01
// 1538080501219-01
// 1537910509569-01
// 1537240509307-01
// 1537190509131-01
// 1537180509079-01
// 1537170509051-01
// 1537150508961-01
// 1536960508599-01
// 1537150508947-01
// 1537110508821-01
// 1537100508755-01
// 1536930508527-01
// 1536900508367-01
// 1536870508273-01
// 1536710508021-01
// 1536690500663-01
// 1536620500581-01
// 1536520500511-01
// 1536470500485-01
// 1536430500481-01