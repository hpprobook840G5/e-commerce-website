import { Canvas } from '@react-three/fiber'

export default function HeroScene() {
  return (
    <div className="w-full h-96">
      <Canvas>
        <ambientLight />
        {/* Motorcycle 3D model placeholder - model will be added later */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial />
        </mesh>
      </Canvas>
    </div>
  )
}

