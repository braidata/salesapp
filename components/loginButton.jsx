import { useState, useContext } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
//use context to get session
import { SessionProvider } from "next-auth/react"

export default function Component() {

  //get user session data
  const { data: session, status } = useSession()
  //save the session token data permanently
  //const [sessionF, setsessionF] = useState(session)
  console.log("session", session)
  
  if (session) {
    return (
      <>
        <br />
        <img src={ `../profiles/logo${session.session ? session.token.picture : null}.png`} title={session.session ? session.token.name : "No conectado"} className="rounded-full w-10 h-10" />
        {/* <button className="hover:backdrop-blur rounded-full p-1 m-1 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-1 dark:hover:bg-white/20" onClick={() => signOut()}>
          <img src="https://img.icons8.com/ios-filled/50/000000/logout-rounded.png" alt="Salir" className="w-4 h-4" />
        </button> */}
      </>
    )
  }
  return (
    <>
      <br />
      <button className="hover:backdrop-blur rounded-full p-1 m-1 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-1 dark:hover:bg-white/20" onClick={() => signIn()}>
        <img src="https://img.icons8.com/ios-filled/50/000000/login-rounded.png" alt="Acceder" className="w-4 h-4" />
      </button>
    </>
  )
}