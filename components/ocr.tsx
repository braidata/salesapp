import React, { useState } from 'react';
import axios from 'axios';


interface OCRFormProps {
  onOCRResult: (ocrResult: string | null, uploadedImageUrl: string | null) => void;
}

const OCRForm: React.FC<OCRFormProps> = ({ onOCRResult }) => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [isPDF, setIsPDF] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsPDF(selectedFile.type === 'application/pdf');
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Enviar la imagen a la API de OCR
      const ocrResponse = await axios.post('/api/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOcrResult(ocrResponse.data.text);

      // Subir la imagen a S3
      const uploadResponse = await axios.post('/api/uploaderS', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Obtener la clave de la imagen subida desde la respuesta de la API
      const imageKey = uploadResponse.data.imageKey;
      setUploadedImageKey(imageKey);

      // Obtener la URL de la imagen utilizando la API readerS
      const readerResponse = await axios.get(`/api/readerS?key=${imageKey}`);
      setUploadedImageUrl(readerResponse.data.url);
      onOCRResult(ocrResponse.data.text, readerResponse.data.url);
    } catch (error) {
      setError('Error processing file');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label htmlFor="file" className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Seleccionar archivo
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
          />
        </div>
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || loading}
            className={`py-2 px-4 rounded-full font-bold text-white transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-105 ${loading
                ? 'bg-gradient-to-r from-blue-500 to-blue-700 relative overflow-hidden'
                : 'bg-gradient-to-r from-blue-600/40 to-blue-800/40 border-2 border-blue-800 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)] hover:bg-blue-600/50 dark:bg-gradient-to-r dark:from-blue-500/40 dark:to-blue-800/60 dark:border-blue-200 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:hover:bg-blue-900'
              }`}
          >
            {loading ? (
              <>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 animate-loading"></span>
                <span className="relative">Procesando...</span>
              </>
            ) : (
              'Extraer texto y subir imagen'
            )}
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 dark:text-red-400 text-xs italic">{error}</p>}
      {ocrResult && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
          <h2 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">Texto extraído:</h2>
          <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{ocrResult}</pre>
          <div className="flex justify-end">
            <button
              onClick={() => navigator.clipboard.writeText(ocrResult)}
              className="mt-2 py-1 px-3 rounded-full font-bold text-gray-800 dark:text-gray-200 transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-105 bg-gradient-to-r from-gray-300/40 to-gray-400/40 border-2 border-gray-400 drop-shadow-[0_9px_9px_rgba(0,0,0,0.2)] hover:bg-gray-300/50 dark:bg-gradient-to-r dark:from-gray-600/40 dark:to-gray-700/60 dark:border-gray-600 dark:drop-shadow-[0_9px_9px_rgba(255,255,255,0.1)] dark:hover:bg-gray-600/50"
            >
              Copiar texto
            </button>
          </div>
        </div>
      )}
      {uploadedImageUrl && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Imagen subida</h2>
          {isPDF ? (
            <iframe src={uploadedImageUrl} width="100%" height="500px" />
          ) : (
            <img src={uploadedImageUrl} alt="Subida" className="w-full h-auto" />
          )}
        </div>
      )}
    </div>
  );
};

export default OCRForm;