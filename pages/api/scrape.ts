import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Asegúrate de manejar los parámetros y errores correctamente
  const url = req.query.url as string;
  const className = req.query.className as string;

    // Inicia Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Ejecuta el código en el navegador
    const data = await page.evaluate((className) => {
        const elements = document.getElementsByClassName(className);
        return Array.from(elements).map((element) => element.textContent);
        }
    , className);

    // Cierra Puppeteer

    await browser.close();

    // Devuelve los datos
    res.status(200).json(data);
}




