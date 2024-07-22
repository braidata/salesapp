// api/getOrder.js

import axios from 'axios';

const apiUrl = 'https://mlojwehfm.ventuscorp.cl/api-ml-ventus/public/getOrder/';

export default async function handler(req: { query: { orderId: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): void; new(): any; }; }; }) {
  const { orderId } = req.query;

  try {
    const response = await axios.get(apiUrl + orderId);
    const data = response.data;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching order data:', error);
    res.status(500).json({ error: 'Error fetching order data. Please try again.' });
  }
}
