import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

interface ScrapedLinksProps {
  url: string;
}

const ScrapedLinks: React.FC<ScrapedLinksProps> = ( {url} ) => {
  const [links, setLinks] = useState<string[]>([]);
  const corsProxy = 'http://localhost:8080'
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<string>(`${url}`);
        const html = response.data;
        const $ = load(html);
        const scrapedLinks: string[] = [];

        $('a').each((index: number, element) => {
          const link = $(element).attr('href');
          if (link) {
            scrapedLinks.push(link);
          }
        });

        setLinks(scrapedLinks);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [url]);

  return (
    <div className="container mx-auto p-4 mt-24">
      <h2 className="text-2xl font-bold mb-4">Enlaces scrapeados de {url}:</h2>
      <ul className="list-disc pl-6">
        {links.map((link, index) => (
          <li key={index} className="mb-2">
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScrapedLinks;


