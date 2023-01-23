import { getSession } from 'next-auth/react'


export default async function requireAuthentication(context: any, callback: any) {
  const session = await getSession(context)


  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    }
  }else {
    return callback(session)
  }

  
}