//get husbpot users

import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const ownerID =  req.body.id ? req.body.id : 52298286
    try {
        const url = `https://api.hubapi.com/owners/v2/owners/${ownerID}?hapikey=${process.env.APP_KEY}`
        const response = await axios({
            method: "GET",
            url: url,
        });
        res.status(200).json({ success: response.data.email, data: response.data.results });
        console.log("OWNERS", response.data.email) //response.data.email, response.data.firstName, response.data.lastName, response.data.ownerId

        

        
    } catch (error) {
        console.log("Intenta de nuevo con el dueño " + error)
        return res.status(500).json({ success: false });
    }
};



