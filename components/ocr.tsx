import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OCRForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Archivo", file);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      console.log("Archivo seleccionado:", selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      console.log("Archivo", file)
      formData.append('file', file);

      const response = await axios.post('/api/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setOcrResult(response.data.text);
    } catch (error) {
      setError('Error processing file');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label htmlFor="file" className="block text-gray-700 font-bold mb-2">
            Select a file
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={!file || loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Processing...' : 'Extract Text'}
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 text-xs italic">{error}</p>}
      {ocrResult && (
        <div className="bg-gray-100 rounded p-4">
          <h2 className="text-lg font-bold mb-2">Extracted Text:</h2>
          <pre className="whitespace-pre-wrap">{ocrResult}</pre>
        </div>
      )}
    </div>
  );
};

export default OCRForm;