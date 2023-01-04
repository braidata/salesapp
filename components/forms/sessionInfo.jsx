//session info 


import react from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function SessionInfo() {

    const { data, status } = useSession({
        required: true,
        
      });
    const router = useRouter();
    

    console.log("DATA",data, "STATUS",status, "DATO",data.user)
    
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
        {/* {!session && (
            <>
            Not signed in <br />
            <button onClick={() => signIn()}>Sign in</button>
            </>
        )}
        {session && (
            <>
            Signed in as {session.user.email} <br />
            <button onClick={() => signOut()}>Sign out</button>
            </>
        )} */}
        </div>
    );
    }