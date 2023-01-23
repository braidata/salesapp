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

    //setsessionF(session)

    //const sessionF = session.user ? session.user.token.user : null
    
    
    return (
     
      <>
       {/* {console.log("El tokenazo: " , sessionF ? sessionF.token : null)} */}
         <br />
         {/* {console.log("session", session ? session.token.token.user.permissions : "no hay sesion")} */}
        {/* <img src={ `../profiles/logo${session.token.token.user ? session.token.token.user.image : null}.png`} title={session.token.token.user ? session.token.token.user.name : "No conectado"} className="rounded-full w-10 h-10" /> */}
        <img src={ `../profiles/logo${session.session ? session.token.picture : null}.png`} title={session.session ? session.token.name : "No conectado"} className="rounded-full w-10 h-10" />
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