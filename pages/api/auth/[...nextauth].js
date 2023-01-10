import NextAuth from "next-auth"
import HubspotProvider from "next-auth/providers/hubspot"
import CredentialsProvider from "next-auth/providers/credentials"


export default NextAuth({
  providers: [
    CredentialsProvider({
          name: "Credenciales de Acceso",
          credentials: {
            useremail: {
              label: "Nombre",
              type: "text",
              placeholder: "jsanchez@ventuscorp.cl",
            },
            password: { label: "Contraseña", type: "password" },
          },
          async authorize(credentials) {

            //fetch api of users database
            //if user exists return user data
            //if not return null

            const user = await fetch(`${process.env.NEXTAUTH_URL}/api/mysqlUsers`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                useremail: credentials.useremail,
                password: credentials.password,
              }),
            })
            const userJson = await user.json()

            if (userJson.user[0].password === credentials.password) {
              console.log("credentials si ahora: ", userJson.user[0].email)
              return  { id: userJson.user[0].id , name: userJson.user[0].name , email: userJson.user[0].email}
            } else {
              //console.log("credentials no: ", userJson)
              return null
            }


        //   },
        // }),




        //     return {
        //       id: 1,
        //       name: "Joana Sanchez",
        //       email: "jsanchez@example.com",
        //       image: "https://i.pravatar.cc/150?",
        //     }
          },
        })
      , 
    HubspotProvider({
          clientId: process.env.HUBSPOT_ID,
          clientSecret: process.env.HUBSPOT_SECRET,
        }),
  ],
  // A database is optional, but required to persist accounts in a database
  

  theme: {
    colorScheme: "auto", // "auto" | "dark" | "light"
    brandColor: "#72d1db", // Hex color code
    buttonText: "#83a1cc" // Hex color code
  }

})
