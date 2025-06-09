import { PDFDocument } from 'pdf-lib';
import type { NextApiRequest, NextApiResponse } from 'next';

interface StarkenResponse {
  data: string[];
  status: number;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { ordenFlete, tipoSalida, combineAll = false } = req.body;

    if (!ordenFlete || !tipoSalida) {
      return res.status(400).json({ 
        message: "Orden de flete y tipo de salida son requeridos", 
        status: 400 
      });
    }

    const credentials = 'crm:crm2019';

    const etiquetaResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000/'}api/starken/etiquetaAPI`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ordenFlete, tipoSalida }),
    });

    if (!etiquetaResponse.ok) {
      throw new Error(`Error from etiquetaAPI: ${etiquetaResponse.statusText}`);
    }

    const etiquetaData: StarkenResponse = await etiquetaResponse.json();

    if (!Array.isArray(etiquetaData.data) || etiquetaData.data.length === 0) {
      throw new Error('No se recibieron URLs de etiquetas');
    }

    // Fetch PDFs from Starken URLs
    const pdfBuffers = await Promise.all(etiquetaData.data.map(async (pdfUrl: string, index: number) => {
      try {
        console.log(`Fetching PDF ${index + 1} from Starken...`);

        const pdfResponse = await fetch(pdfUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(credentials).toString('base64')}`
          }
        });

        if (!pdfResponse.ok) {
          throw new Error(`Starken API returned ${pdfResponse.status}`);
        }

        return await pdfResponse.arrayBuffer();
      } catch (error) {
        console.error(`Error fetching PDF ${index + 1}:`, error);
        return null;
      }
    }));

    const validBuffers = pdfBuffers.filter(Boolean);

    if (validBuffers.length === 0) {
      throw new Error('No se pudo obtener ninguna etiqueta');
    }

    // Process PDFs
    if (combineAll) {
      // Combine all PDFs into one document
      const mergedPdf = await PDFDocument.create();
      
      for (const buffer of validBuffers) {
        const pdf = await PDFDocument.load(buffer);
        const [page] = await mergedPdf.copyPages(pdf, [0]);
        page.setSize(612, 792); // Letter size
        mergedPdf.addPage(page);
      }

      const mergedPdfBytes = await mergedPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100
      });

      return res.status(200).json({
        message: "Etiquetas combinadas correctamente",
        data: [`data:application/pdf;base64,${Buffer.from(mergedPdfBytes).toString('base64')}`],
        status: 200,
        processed: validBuffers.length,
        total: etiquetaData.data.length,
        combined: true
      });
    } else {
      // Process individual PDFs
      const processedPdfs = await Promise.all(validBuffers.map(async (buffer, index) => {
        try {
          const pdfDoc = await PDFDocument.load(buffer);
          const newPdfDoc = await PDFDocument.create();
          const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
          
          firstPage.setSize(612, 792); // Letter size
          newPdfDoc.addPage(firstPage);

          const processedPdfBytes = await newPdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 100
          });

          return `data:application/pdf;base64,${Buffer.from(processedPdfBytes).toString('base64')}`;
        } catch (error) {
          console.error(`Error processing PDF ${index + 1}:`, error);
          return null;
        }
      }));

      const validPdfs = processedPdfs.filter(Boolean);

      if (validPdfs.length === 0) {
        throw new Error('No se pudo procesar ninguna etiqueta correctamente');
      }

      return res.status(200).json({
        message: `${validPdfs.length} etiquetas procesadas correctamente`,
        data: validPdfs,
        status: 200,
        processed: validPdfs.length,
        total: etiquetaData.data.length,
        combined: false
      });
    }

  } catch (error) {
    console.error('Error en processEtiqueta:', error);
    return res.status(500).json({
      message: error.message || "Error interno procesando etiqueta",
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}