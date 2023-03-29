import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

interface ScrapedLinksProps {
  url: string;
}

interface ScrapedData {
  link: string;
  headers: string[];
  paragraphs: string[];
}

const ScrapedLinks: React.FC<ScrapedLinksProps> = ({ url }) => {
  const [data, setData] = useState<ScrapedData[]>([]);
  const corsProxy = 'http://localhost:8080'
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<string>(`${corsProxy}/${url}`);
        const html = response.data;
        const $ = load(html);
        const scrapedLinks: string[] = [];

        $('a').each((index: number, element) => {
          const link = $(element).attr('href');
          if (link) {
            scrapedLinks.push(link);
          }
        });

        const scrapedDataPromises = scrapedLinks.map(async (link) => {
          try {
            const response = await axios.get<string>(link);
            const html = response.data;
            const $ = load(html);

            const headers: string[] = [];
            const paragraphs: string[] = [];

            $('h1, h2, h3, h4, h5, h6').each((index, element) => {
              headers.push($(element).text());
            });

            $('p').each((index, element) => {
              paragraphs.push($(element).text());
            });

            return { link, headers, paragraphs };
          } catch (error) {
            console.error(`Error scraping ${link}: `, error);
            return { link, headers: [], paragraphs: [] };
          }
        });

        const scrapedData = await Promise.all(scrapedDataPromises);
        setData(scrapedData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [url]);

  return (
    <div className="container mx-auto p-4 mt-24">
      <h2 className="text-2xl font-bold mb-4">Datos scrapeados de {url}:</h2>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">Enlace</th>
            <th className="border px-4 py-2">Encabezados</th>
            <th className="border px-4 py-2">Párrafos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {item.link}
                </a>
              </td>
              <td className="border px-4 py-2">
                <ul>
                  {item.headers.map((header, idx) => (
                    <li key={idx}>{header}</li>
                  ))}
                </ul>
              </td>
              <td className="border px-4 py-2">
                <ul>
                  {item.paragraphs.map((paragraph, idx) => (
                    <li key={idx}>{paragraph}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>);

};

export default ScrapedLinks;