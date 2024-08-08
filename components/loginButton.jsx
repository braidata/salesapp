import { useState, useContext, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
//use context to get session
import { SessionProvider } from "next-auth/react"

export default function Component() {
  const { data: session, status } = useSession()
  const [imageSrc, setImageSrc] = useState("")

  useEffect(() => {
    const checkImageExists = async (url) => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          return true
        }
        return false
      } catch (error) {
        return false
      }
    }

    const updateImageSrc = async () => {
      if (session) {
        const imageUrl = `../profiles/logo${session.token.picture}.png`
        const imageExists = await checkImageExists(imageUrl)
        if (imageExists) {
          setImageSrc(imageUrl)
        } else {
          setImageSrc("../profiles/logoU.png")
        }
      } else {
        setImageSrc("../profiles/logoU.png")
      }
    }

    updateImageSrc()
  }, [session])

  if (session) {
    return (
      <>
        <br />
        <img src={imageSrc} title={session.token.name} className="rounded-full w-10 h-10" />
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
