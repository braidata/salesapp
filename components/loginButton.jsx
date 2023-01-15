import { useSession, signIn, signOut } from "next-auth/react"
export default function Component() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
         <br />
         {/* {console.log("session", session ? session.token.token.user.permissions : "no hay sesion")} */}
        <img src={ `../profiles/logo${session.token.token.user ? session.token.token.user.image : null}.png`} title={session.token.token.user ? session.token.token.user.name : "No conectado"} className="rounded-full w-10 h-10" />
        <button className="hover:backdrop-blur rounded p-1 m-4 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20" onClick={() => signOut()}>Salir</button>
      </>
    )
  }
  return (
    <>
      No conectado <br />
      <button className="hover:backdrop-blur rounded p-1 m-4 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20" onClick={() => signIn()}>Acceder</button>
    </>
  )
}