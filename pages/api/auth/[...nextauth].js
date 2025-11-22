import NextAuth from "next-auth"
import HubspotProvider from "next-auth/providers/hubspot"
import CredentialsProvider from "next-auth/providers/credentials"

// export const runtime = 'edge';

let user = null

export default NextAuth({

  
  

  providers: [
    CredentialsProvider({
      name: "Credenciales de Acceso",
      credentials: {
        useremail: {
          label: "Correo Electrónico",
          type: "text",
          placeholder: "jsanchez@ventuscorp.cl",
        },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.useremail || !credentials?.password) return null

        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/mysqlUsers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            useremail: credentials.useremail,
            password: credentials.password,
          }),
        })

        if (!response.ok) return null

        const userJson = await response.json()
        const candidate = userJson?.user?.[0]

        if (!candidate || candidate.password !== credentials.password) {
          return null
        }

        return {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          role: candidate.rol,
          permissions: candidate.permissions,
          image: candidate.image,
        }
      },
    }),

    // HubspotProvider({
    //       clientId: process.env.HUBSPOT_ID,
    //       clientSecret: process.env.HUBSPOT_SECRET,
    //     }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
        token.permissions = user.permissions
        token.image = user.image
      }

      return token
    },

    async session({ session, token }) {
      session.token = token
      return session
    },
  },

  theme: {
    colorScheme: "auto", // "auto" | "dark" | "light"
    brandColor: "#72d1db", // Hex color code
    buttonText: "#83a1cc", // Hex color code
  },
})
