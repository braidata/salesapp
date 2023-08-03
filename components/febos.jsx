/*  component for this api:

import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { id } = req.body ? req.body : req.query;

  const empresa = '99522260-4';
  const token = 'MWJhZjJiNDkyNzIyNTI0NmQ3MmIyZDQyNzk2MTUzMWI1NTlh';

  const url = `https://api.febos.cl/produccion/documentos/${id}?imagen=si&tipoImagen=3&regenerar=no&incrustar=no&xmlFirmado=si`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      empresa,
      token,
    },
  });

  const data = await response.json();

  res.status(response.status).json(data);
} */

import { useState } from 'react';

function Documento() {
  const [id, setId] = useState('');
  const [documento, setDocumento] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const response = await fetch('/api/febos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();
    setDocumento(data);
  }

  return (
    <div>
      <h1>Buscar documento</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="id">ID:</label>
        <input type="text" id="id" value={id} onChange={event => setId(event.target.value)} />
        <button type="submit">Buscar</button>
      </form>

      {documento && (
        <div>
          <h2>Resultado</h2>
          <p>febosId: {documento.febosId}</p>
          <p>rutEmisor: {documento.rutEmisor}</p>
          <p>rutReceptor: {documento.rutReceptor}</p>
          <p>razonSocialEmisor: {documento.razonSocialEmisor}</p>
          <p>razonSocialReceptor: {documento.razonSocialReceptor}</p>
          <p>fechaEmision: {documento.fechaEmision}</p>
          <p>folio: {documento.folio}</p>
          <p>tipo: {documento.tipo}</p>
          <p>fechaRecepcion: {documento.fechaRecepcion}</p>
          {documento.imagenLink && (
            <div>
              <p>imagenLink:</p>
              <embed src={documento.imagenLink} type="application/pdf" width="100%" height="600px" />
            </div>
          )}
          <p>codigo: {documento.codigo}</p>
          <p>mensaje: {documento.mensaje}</p>
          <p>seguimientoId: {documento.seguimientoId}</p>
          <p>duracion: {documento.duracion}</p>
          <p>hora: {documento.hora}</p>
        </div>
      )}
    </div>
  );
}

export default Documento;

