import { memo } from 'react';

const Lighting = memo(function Lighting() {
  return (
    <>
      {/* Ambient fill — crisp clean white */}
      <ambientLight intensity={0.55} color="#ffffff" />

      {/* Main directional — from above-front, casts shadows */}
      <directionalLight
        position={[5, 20, 10]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
      />

      {/* Stage accent light — red */}
      <pointLight position={[0, 5, -14]} intensity={0.8} color="#C00020" distance={25} decay={2} />

      {/* Fill light from back */}
      <directionalLight position={[-5, 12, 18]} intensity={0.5} color="#e8e0d8" />

      {/* Top down fill */}
      <directionalLight position={[0, 20, 0]} intensity={0.4} color="#ffffff" />
    </>
  );
});

export default Lighting;
