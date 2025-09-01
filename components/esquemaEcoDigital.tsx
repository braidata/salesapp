import React, { useState } from 'react';

const EcosistemaDigital = () => {
  const [hoveredSection, setHoveredSection] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState('all');

  const layers = [
    { id: 'all', name: 'Todo' },
    { id: 'infra', name: 'Infraestructura' },
    { id: 'core', name: 'Core Business' },
    { id: 'integration', name: 'Integraciones' },
    { id: 'channels', name: 'Canales Digitales' },
    { id: 'marketing', name: 'Marketing' }
  ];

  const shouldShowLayer = (layerId) => selectedLayer === 'all' || selectedLayer === layerId;

  const Section = ({ id, children, layer, className = "" }) => (
    <div 
      className={`transition-all duration-300 ${!shouldShowLayer(layer) ? 'opacity-30 scale-95' : 'opacity-100 scale-100'} ${className}`}
      onMouseEnter={() => setHoveredSection(id)}
      onMouseLeave={() => setHoveredSection(null)}
    >
      {children}
    </div>
  );

  const Card = ({ title, subtitle, items = [], color, textColor = "text-gray-700", className = "" }) => (
    <div className={`${color} ${className} rounded-lg border-2 border-opacity-60 p-4 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer h-full flex flex-col justify-center`}>
      <h3 className={`font-bold text-sm ${textColor} leading-tight mb-2`}>{title}</h3>
      {subtitle && <p className={`text-xs ${textColor} opacity-80 mb-2`}>{subtitle}</p>}
      {items.map((item, idx) => (
        <p key={idx} className={`text-xs ${textColor} opacity-70 leading-tight`}>• {item}</p>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* Fixed Header with Navigation */}
      <div className="sticky top-0 bg-white dark:bg-slate-900/80 dark:backdrop-blur shadow-md z-20 py-6 dark:py-8 px-6 border-b dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 text-center mb-8 dark:mt-2">
          Ecosistema Digital - Imega Ventus
        </h1>
        
        {/* Horizontal Navigation */}
        <div className="flex justify-center gap-2 flex-wrap max-w-4xl mx-auto">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${
                selectedLayer === layer.id 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600'
              }`}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-8 pb-6 space-y-6">
        {/* Infrastructure Layer */}
        <Section
          id="infrastructure"
          layer="infra"
          className="bg-blue-50 dark:bg-slate-900 p-5 rounded-xl border-2 border-blue-200 dark:border-slate-800"
        >
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-3">INFRAESTRUCTURA</h2>
          <div className="grid grid-cols-4 gap-4">
            <Card 
              title="AWS" 
              subtitle="Integraciones"
              color="bg-orange-100 dark:bg-orange-900 border-orange-200 dark:border-orange-800" 
              textColor="text-orange-800 dark:text-orange-100"
            />
            <Card 
              title="Microsoft Azure" 
              subtitle="SAP Backend"
              color="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800" 
              textColor="text-blue-800 dark:text-blue-100"
            />
            <Card 
              title="Servidor Físico" 
              subtitle="On-Premise"
              color="bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700" 
              textColor="text-gray-700 dark:text-slate-100"
            />
            <Card 
              title="WatchGuard" 
              subtitle="VPN y Security"
              color="bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800" 
              textColor="text-red-800 dark:text-red-100"
            />
          </div>
        </Section>

        {/* Core Business Layer - Grid Layout */}
        <Section
          id="core-business"
          layer="core"
          className="bg-gray-100 dark:bg-slate-900 p-6 rounded-xl border-2 border-gray-300 dark:border-slate-800"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">CORE BUSINESS</h2>
          <div className="grid grid-cols-5 gap-4">
            <Card 
              title="SAP ERP" 
              subtitle="Sistema Central"
              color="bg-blue-200 dark:bg-blue-900 border-blue-300 dark:border-blue-700" 
              textColor="text-blue-900 dark:text-blue-100"
            />
            <Card 
              title="HubSpot CRM" 
              color="bg-orange-100 dark:bg-orange-900 border-orange-200 dark:border-orange-800" 
              textColor="text-orange-800 dark:text-orange-100"
            />
            <Card 
              title="Microsoft 365" 
              subtitle="Ofimática y Correo"
              color="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800" 
              textColor="text-blue-800 dark:text-blue-100"
            />
            <Card 
              title="Febos" 
              subtitle="Facturación Electrónica"
              color="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800" 
              textColor="text-green-800 dark:text-green-100"
            />
            <Card 
              title="Intranet Ventus" 
              subtitle="Herramientas y Reportería"
              color="bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800" 
              textColor="text-purple-800 dark:text-purple-100"
            />
          </div>
        </Section>

        {/* Integration Layer - Grid Layout */}
        <Section
          id="integration"
          layer="integration"
          className="bg-gray-50 dark:bg-slate-900 p-6 rounded-xl border-2 border-gray-200 dark:border-slate-800"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">CAPA DE INTEGRACIÓN</h2>
          <div className="grid grid-cols-6 gap-3">
            <Card 
              title="Middleware de Pedidos" 
              subtitle="Ecommerce ↔ SAP"
              color="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800" 
              textColor="text-green-800 dark:text-green-100"
            />
            <Card 
              title="Integración Logística" 
              subtitle="Starken, 99Min"
              color="bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800" 
              textColor="text-yellow-800 dark:text-yellow-100"
            />
            <Card 
              title="Integración Multivende" 
              subtitle="Marketplaces"
              color="bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800" 
              textColor="text-red-800 dark:text-red-100"
            />
            <Card 
              title="Integración Retail B2B" 
              subtitle="Comercio Mayorista"
              color="bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800" 
              textColor="text-purple-800 dark:text-purple-100"
            />
            <Card 
              title="Integración HubSpot" 
              subtitle="CRM Sync"
              color="bg-orange-100 dark:bg-orange-900 border-orange-200 dark:border-orange-800" 
              textColor="text-orange-800 dark:text-orange-100"
            />
            <Card 
              title="Integración de Pagos" 
              items={["Webpay", "Mercado Libre"]}
              color="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800" 
              textColor="text-blue-800 dark:text-blue-100"
            />
          </div>
        </Section>

        {/* Digital Channels Layer - Grid Layout */}
        <Section
          id="channels"
          layer="channels"
          className="bg-yellow-50 dark:bg-slate-900 p-6 rounded-xl border-2 border-yellow-200 dark:border-slate-800"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-yellow-100 mb-4">CANALES DIGITALES</h2>
          
          <div className="grid grid-cols-3 gap-6">
            {/* E-commerce Group */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-3 text-center">E-COMMERCE</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Card 
                  title="VTEX" 
                  items={["VENTUS", "Blanik", "BBQ"]}
                  color="bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800" 
                  textColor="text-red-800 dark:text-red-100"
                />
                <Card 
                  title="WooCommerce" 
                  items={["Ventus Repuestos", "Libero", "B2B"]}
                  color="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800" 
                  textColor="text-blue-800 dark:text-blue-100"
                />
              </div>
            </div>

            {/* Non-Transactional Sites Group */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-3 text-center">SITIOS NO TRANSACCIONALES</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Card 
                  title="imega.cl" 
                  color="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800" 
                  textColor="text-green-800 dark:text-green-100"
                />
                <Card 
                  title="Ventus Bolivia" 
                  color="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800" 
                  textColor="text-green-800 dark:text-green-100"
                />
              </div>
              <div className="grid grid-cols-1">
                <Card 
                  title="Ventus HK" 
                  color="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800" 
                  textColor="text-green-800 dark:text-green-100"
                />
              </div>
            </div>

            {/* Marketplaces Group */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-3 text-center">MULTIVENDE - MARKETPLACES</h3>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Card 
                  title="Mercado Libre" 
                  color="bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-800" 
                  textColor="text-yellow-800 dark:text-yellow-100"
                />
                <Card 
                  title="Falabella" 
                  color="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800" 
                  textColor="text-green-800 dark:text-green-100"
                />
                <Card 
                  title="Paris" 
                  color="bg-pink-100 dark:bg-pink-900 border-pink-200 dark:border-pink-800" 
                  textColor="text-pink-800 dark:text-pink-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Card 
                  title="Walmart" 
                  color="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800" 
                  textColor="text-blue-800 dark:text-blue-100"
                />
                <Card 
                  title="Ripley" 
                  color="bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800" 
                  textColor="text-red-800 dark:text-red-100"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Marketing Tools Layer - Grid Layout */}
        <Section
          id="marketing"
          layer="marketing"
          className="bg-green-50 dark:bg-slate-900 p-6 rounded-xl border-2 border-green-200 dark:border-slate-800"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-green-100 mb-4">HERRAMIENTAS Y PLATAFORMAS DE MARKETING</h2>
          <div className="grid grid-cols-4 gap-4">
            <Card 
              title="Google Marketing" 
              items={["Ads - Analytics - Tag Manager", "Search Console - Data Studio", "My Business - Shopping"]}
              color="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800" 
              textColor="text-blue-800 dark:text-blue-100"
            />
            <Card 
              title="Meta Business" 
              items={["Facebook Ads - Instagram Ads", "Business Manager - Pixel"]}
              color="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800" 
              textColor="text-blue-800 dark:text-blue-100"
            />
            <Card 
              title="Medición y UX" 
              subtitle="Hotjar"
              items={["Heatmaps - Session Recording", "User Feedback"]}
              color="bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800" 
              textColor="text-purple-800 dark:text-purple-100"
            />
            <Card 
              title="SEO y Research" 
              subtitle="SEMrush"
              items={["Keywords - Competition", "Backlinks - Site Audit"]}
              color="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800" 
              textColor="text-green-800 dark:text-green-100"
            />
          </div>
        </Section>
      </div>

      {/* Architecture Flow - Fixed at bottom */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-950/80 dark:backdrop-blur border-t border-gray-200 dark:border-slate-800 p-4 text-center shadow-lg">
        <p className="font-bold text-gray-800 dark:text-slate-100 text-sm">
          ARQUITECTURA: Infraestructura → Core Business → Integraciones → Canales Digitales → Marketing
        </p>
      </div>

      {/* Hover Information */}
      {hoveredSection && (
        <div className="fixed bottom-20 left-4 bg-black dark:bg-slate-800/90 text-white p-3 rounded-lg shadow-lg z-10 transition-all duration-200">
          <p className="text-sm">Sección: <span className="font-semibold capitalize">{hoveredSection}</span></p>
        </div>
      )}
    </div>
  );
};

export default EcosistemaDigital;
