import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
const token = process.env.SIMPLI_PROD;
//account
//const url = 'https://api.simpliroute.com/v1/accounts/me/';
//users

const url = "https://api.simpliroute.com/v1/accounts/drivers/"

// VEHICLES - PLAN - ROUTE - VISITS 

// VISITS BY ROUTE OF PLAN
//const url = "https://api.simpliroute.com/v1/plans/routes/e93d0d35-68d9-4d80-99f6-94ab20c8ab59/visits/"

// ID PLANS BY DATE
//const url = "https://api.simpliroute.com/v1/plans/2023-05-15/"

// ALL PLANS BY ID
//const url = "https://api.simpliroute.com/v1/plans/ef6df325-c0ef-4211-bf6e-7083b5b535f3/"

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




