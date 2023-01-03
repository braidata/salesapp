// p5js nextjs component
import React from 'react';
import dynamic from 'next/dynamic'

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})
//import Sketch from 'react-p5';

const Creator = () => {
    
    let x = 100;
    let y = 100;
    
    const setup = (p5, canvasParentRef) => {
        p5.createCanvas(700, 700).parent(canvasParentRef);
    };
    
    const draw = p5 => {
        p5.background(0);
        p5.ellipse(x, y, 70, 70);
        //y++;
        
    };
    
    return <Sketch setup={setup} draw={draw} />;
}

export default Creator;