// components/dashboard/ui/LoadingState.tsx
import React from 'react';
import { colors } from '../constants/colors';

interface LoadingStateProps {
  message?: string;
  type?: 'full' | 'inline' | 'overlay';
  isLoading: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Cargando datos...", 
  type = 'inline',
  isLoading
}) => {
  if (!isLoading) return null;
  
  // Estilos para diferentes tipos de carga
  const containerStyles = {
    full: "fixed inset-0 z-50 flex items-center justify-center bg-opacity-80",
    inline: "w-full h-full min-h-[200px] flex items-center justify-center",
    overlay: "absolute inset-0 z-10 flex items-center justify-center bg-opacity-60"
  };
  
  return (
    <div 
      className={containerStyles[type]} 
      style={{ 
        backgroundColor: type === 'inline' ? 'transparent' : colors.background 
      }}
    >
      <div className="flex flex-col items-center p-6 rounded-lg backdrop-blur-md" style={{ backgroundColor: `${colors.secondary}90` }}>
        {/* Spinner elegante */}
        <div className="relative w-16 h-16 mb-4">
          {/* Círculo exterior */}
          <div 
            className="absolute w-full h-full rounded-full animate-ping opacity-20"
            style={{ backgroundColor: colors.accent }}
          ></div>
          
          {/* Anillo giratorio */}
          <div 
            className="absolute w-full h-full rounded-full border-t-2 border-b-2 animate-spin"
            style={{ borderColor: colors.accent }}
          ></div>
          
          {/* Punto central */}
          <div 
            className="absolute inset-0 m-auto w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.accent }}
          ></div>
        </div>
        
        {/* Mensaje de carga */}
        <p style={{ color: colors.text }}>{message}</p>
        
        {/* Barra de progreso pulsante */}
        <div className="w-48 h-1 mt-3 rounded-full overflow-hidden">
          <div 
            className="h-full animate-pulse"
            style={{ backgroundColor: colors.accent }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;