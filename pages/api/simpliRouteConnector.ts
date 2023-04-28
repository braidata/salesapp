import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
const token = process.env.SIMPLI_PROD;
//account
//const url = 'https://api.simpliroute.com/v1/accounts/me/';

const url = "https://api.simpliroute.com/v1/routes/visits/264341355"

const response = await fetch(url, {
method: 'GET',
headers: {
'Content-Type': 'application/json',
authorization:   `Token ${token}`,
},
});

const data = await response.json();
res.status(200).json(data);
};

// Path: pages/api/simpliRouteConnector.ts
// api to connect to simpliRoute the token is the env variable SIMPLI_PROD
