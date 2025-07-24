import React, { useState, useEffect } from 'react';
import { Search, Package, Calendar, User, CheckCircle, Clock, AlertCircle, FileText, Hash, ShoppingBag, CreditCard, Truck, Receipt, ChevronRight, Building, ExternalLink } from 'lucide-react';

const SAPOrderViewer = () => {
  const [orderNumber, setOrderNumber] = useState('2000012048875022');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingDTE, setLoadingDTE] = useState(false);

  const searchOrder = async () => {
    if (!orderNumber.trim()) return;
    
    setLoading(true);
    setError(null);
    setOrderData(null); // Limpia los datos anteriores
    
    try {
      const response = await fetch(
        `/api/apiSAPSalesEcommerce?limit=10&purchaseOrder=${orderNumber}`
      );
      
      if (!response.ok) throw new Error('Error en la búsqueda');
      
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setOrderData(data.data[0]);
      } else {
        setError('No se encontró la orden especificada');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') searchOrder();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (statusCode) => {
    switch(statusCode) {
      case 'C': return <CheckCircle className="w-4 h-4" />;
      case 'P': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (statusCode) => {
    switch(statusCode) {
      case 'C': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'P': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const viewDocument = async (id) => {
    setLoadingDTE(true);
    try {
      const response = await fetch(`/api/febos?id=${id}`);
      if (!response.ok) throw new Error("Error al obtener el documento de Febos");
      const data = await response.json();
      window.open(data.imagenLink, "_blank");
    } catch (error) {
      console.error("Error al obtener el documento de Febos:", error);
      alert("Error al cargar la DTE");
    } finally {
      setLoadingDTE(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black opacity-50" />
      
      <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">
            Consulta de Órdenes SAP
          </h1>
          <p className="text-gray-500">Sistema de seguimiento empresarial</p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10 shadow-2xl">
            <label className="block text-sm text-gray-400 mb-4">Número de Orden</label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ingrese número de orden"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-200"
                />
                <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              </div>
              <button
                onClick={searchOrder}
                disabled={loading}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Buscar
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        {orderData && (
          <div className="space-y-6 animate-fadeIn">
            {/* Order Overview */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-light text-white mb-1">
                      Orden {orderData.purchaseOrder}
                    </h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(orderData.creationDateFormatted).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusStyle(orderData.statusCode)}`}>
                    {getStatusIcon(orderData.statusCode)}
                    <span className="text-sm font-medium">{orderData.status}</span>
                  </div>
                </div>

                {/* Key Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <User className="w-3 h-3" />
                      CLIENTE
                    </div>
                    <p className="text-white font-medium">{orderData.customer}</p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <Receipt className="w-3 h-3" />
                      ORDEN SAP
                    </div>
                    <p className="text-white font-medium">{orderData.sapOrder}</p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <FileText className="w-3 h-3" />
                      DOCUMENTO
                    </div>
                    <p className="text-white font-medium">{orderData.document}</p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                      <Building className="w-3 h-3" />
                      TIPO
                    </div>
                    <p className="text-white font-medium">{orderData.documentTypeText}</p>
                  </div>
                </div>

                {/* Status Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                          <Truck className="w-3 h-3" />
                          ESTADO DE ENTREGA
                        </div>
                        <p className="text-white font-medium">{orderData.deliveryStatus || 'Sin información'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                          <CreditCard className="w-3 h-3" />
                          ESTADO DE FACTURACIÓN
                        </div>
                        <p className="text-white font-medium">{orderData.billingStatus || 'Sin información'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-light text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Detalle de Productos
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="text-center px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orderData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-400">{item.sku}</td>
                        <td className="px-6 py-4 text-sm text-white">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 text-center">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm text-white text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10">
                      <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-400 text-right">Total</td>
                      <td className="px-6 py-4 text-lg font-medium text-white text-right">{formatCurrency(orderData.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Additional Information */}
            {orderData.febosFC && (
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Información Adicional</h3>
                    <p className="text-xs text-gray-600">ID Febos: {orderData.febosFC}</p>
                  </div>
                  <button
                    onClick={() => viewDocument(orderData.febosFC)}
                    disabled={loadingDTE}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingDTE ? (
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-400 rounded-full animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    {loadingDTE ? "Cargando..." : "Ver DTE"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SAPOrderViewer;