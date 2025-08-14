// pages/testeo.js

// import SapOrdersViewer from "../components/sapOrdersViewer";
import CotizadorStarken from "../components/cotizadorStarken"


const Testeo = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <CotizadorStarken />
      </div>
    </div>
  );
};

export default Testeo;