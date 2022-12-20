// p5js nextjs component
import React from 'react';
import Sketch from 'react-p5';

const Creator = () => {
    
    let x = 100;
    let y = 100;
    
    const setup = (p5, canvasParentRef) => {
        p5.createCanvas(700, 700).parent(canvasParentRef);
    };
    
    const draw = p5 => {
        p5.background(0);
        p5.ellipse(x, y, 70, 70);
    };
    
    return <Sketch setup={setup} draw={draw} />;
}

export default Creator;

