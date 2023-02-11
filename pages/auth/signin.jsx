import { getCsrfToken } from "next-auth/react"

export default function SignIn({ props }) {
  return (
    <form className="mt-24" method="POST" action="/api/auth/callback/credentials?csrf=true">
      <input name="csrfToken" type="hidden" value={getCsrfToken} />
      <label for="input-useremail-for-credentials-provider">
        Email
        <input name="username" type="text" id="input-useremail-for-credentials-provider"
         />
      </label>
      <label for="input-password-for-credentials-provider">
        Contraseña
        <input name="password" type="password" id="input-password-for-credentials-provider"  />
      </label>
      <button type="submit">Ingresar</button>
    </form>
  )
}

export async function getServerSideProps(context) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  }
}