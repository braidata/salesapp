import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

function ImageUploader() {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();
  const [response, setResponse] = useState();

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/uploader', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('La imagen se ha cargado correctamente');
        setResponse('La imagen se ha cargado correctamente');
      } else {
        console.error('Error al cargar la imagen:', response.statusText);
        setResponse('Error al cargar la imagen');
      }
    } catch (error) {
      console.error('Error al cargar la imagen:', error);
      setResponse('Error al cargar la imagen');
    }
  };

  const files = acceptedFiles.map((file) => (
    <li key={file.path}>
      {file.path} - {file.size} - {file.type} - {file.name} -{' '}
      {/* obtener extensión */}
      {file.name.split('.').pop()} - bytes
      <button onClick={() => handleFileUpload(file)}>Cargar</button>
    </li>
  ));

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Arrastra y suelta una imagen aquí, o haz clic para seleccionar una imagen</p>
      <ul>{files}</ul>
      {response && <p>{response}</p>}
    </div>
  );
}

export default ImageUploader;

// Path: pages/index.js

//como leo esto desde la api pongo req.body? 


