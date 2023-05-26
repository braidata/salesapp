import { NextApiRequest, NextApiResponse } from 'next';
import { title } from 'process';
import { number } from 'yup';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const token = process.env.SIMPLI_PROD;
    const title = req.body.title;
    const numberAdd = req.body.numberAdd;
    const street = req.body.street;
    const comuna = req.body.comuna;
    const names = req.body.names;
    const lastNames = req.body.lastNames;
    const phone = req.body.phone;
    const email = req.body.email;
    const referenceID = req.body.referenceID;
    const notes = req.body.notes;
    const date = req.body.date;


    const url = "https://api.simpliroute.com/v1/routes/visits/"
    const gato = {
      "title": title,
      "address": `${numberAdd} ${street}, ${comuna}, Chile`,
      "contact_name": `${names} ${lastNames}`,
      "contact_phone": phone,
      "contact_email": email,
      "reference": referenceID,
      "notes": notes,
      "planned_date": date ? date : Date.now(),
}

   //post gato to the url
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            authorization: `Token ${token}`,
        },
        body: JSON.stringify(gato),
    });

    const data = await response.json();
    res.status(200).json(data);
};

// component function to call this
// const addVisit = async () => {
//     const response = await fetch('/api/simpliRouteConnectorPost', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             title: 'test',
//             numberAdd: '123',
//             street: 'test',
//             comuna: 'test',
//             nameContact: 'test',
//             phone: 'test',
//             email: 'test',
//             referenceID: 'test',
//             notes: 'test',
//             date: '2021-05-15',
//         }),
//     });






// Path: pages/api/simpliRouteConnectorPost.ts