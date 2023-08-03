import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ScrapedLinksPuppeteerProps {
  url: string;
  className: string;
}

const ScrapedLinksPuppeteer: React.FC<ScrapedLinksPuppeteerProps> = ({ url, className }) => {
  const [links, setLinks] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [url, className]);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/scrape', {
        params: {
          url,
          className,
        },
      });
      setLinks(response.data.links);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
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

export default ScrapedLinksPuppeteer;
