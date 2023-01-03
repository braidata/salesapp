import NextAuth from "next-auth"
import HubspotProvider from "next-auth/providers/hubspot"
import CredentialsProvider from "next-auth/providers/credentials"

export default NextAuth({
  providers: [
    CredentialsProvider({
          name: "Credenciales de Acceso",
          credentials: {
            username: {
              label: "Nombre",
              type: "text",
              placeholder: "jsanchez",
            },
            password: { label: "Contraseña", type: "password" },
          },
          async authorize() {
            return {
              id: 1,
              name: "Joana Sanchez",
              email: "jsanchez@example.com",
              image: "https://i.pravatar.cc/150?",
            }
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
    brandColor: "#aaaa55", // Hex color code
    buttonText: "ffff22" // Hex color code
  }

})
