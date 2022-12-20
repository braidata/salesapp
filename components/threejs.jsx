//nextjs glb threejs

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import {FlyControls} from "three/examples/jsm/controls/FlyControls"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

extend({ OrbitControls, FlyControls });

const Model = ({ url }) => {
  const gltf = useGLTF(url, true);
  gltf.scene.traverse((child) => {

    // switch(child.name) {
    //     case child.name == "Esfera":
    //         child.material.transparent = true;
    //         child.material.opacity = 0.3;
    //         break;
    //     case child.name == "Cubo001":
    //         child.material.transparent = true;
    //         child.material.opacity = 0.3;
    //         break;
    //     case child.name == "Círculo_001":
    //         child.material.transparent = true;
    //         child.material.opacity = 0.3;
    //         break;
    //     case child.name == "Cubo003":
    //         child.material.transparent = true;
    //         child.material.opacity = 0.3;
    //         break;
    //         }

        
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
    }
    if (child.name == "Círculo_1" ) {
      child.material.transparent = true;
      child.material.opacity = 0.3;
    }

    if (child.name == "Esfera" ) {
        child.material.transparent = true;
        child.material.opacity = 0.3;
      }

      if (child.name == "Cubo001" ) {
        child.material.transparent = true;
        child.material.opacity = 0.3;
      }

        if (child.name == "Cubo003" ) {
        child.material.transparent = true;
        child.material.opacity = 0.3;
        }

        if (child.name == "Cubo002" ) {
        child.material.transparent = true;
        child.material.opacity = 0.3;
        }
        
        // const objts = gltf.nodes
        // {for (const [key, value] of Object.entries(objts)) {
        //     console.log(key, value);
        //     if (child.name == key ) {
        //         child.material.transparent = true;
        //         child.material.opacity = 0.3;
        //   }   }}
     
        




  });

  console.log(gltf);
  return <primitive object={gltf.scene} dispose={null} />;
};

const Threejs = () => {
  return (
    <div className="flex flex-col justify-center items-center h-full">
      <Canvas camera={{ position: [0, 10, 12] }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 15, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -15, -10]} />
        <Model url="/model/toyrocket.glb" />
        <CameraControls />
      </Canvas>
    </div>
  );
};

const CameraControls = () => {


  const {
    camera,
    gl: { domElement },
  } = useThree();
  
  const controls = useRef();
  useFrame((state) => controls.current.update());
  return (
    <orbitControls
    ref={controls}
    args={[camera, domElement]}
    enableZoom={true}
    enableDamping={true}
  />
    // <flyControls
    //   ref={controls}
    //   args={[camera, domElement]}
    //   enableZoom={true}
    // />
  );
};

export default Threejs;
