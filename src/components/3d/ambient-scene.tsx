"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function FloatingShape({
  position,
  shape,
  color,
  scale = 1,
  speed = 1,
}: {
  position: [number, number, number];
  shape: "torus" | "torusKnot" | "octahedron" | "icosahedron";
  color: string;
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    switch (shape) {
      case "torus":
        return new THREE.TorusGeometry(0.4 * scale, 0.15 * scale, 16, 32);
      case "torusKnot":
        return new THREE.TorusKnotGeometry(0.35 * scale, 0.12 * scale, 64, 8);
      case "octahedron":
        return new THREE.OctahedronGeometry(0.35 * scale);
      case "icosahedron":
        return new THREE.IcosahedronGeometry(0.3 * scale);
    }
  }, [shape, scale]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.2 * speed;
      ref.current.rotation.y += delta * 0.3 * speed;
    }
  });

  return (
    <Float speed={1.5 * speed} rotationIntensity={0.3} floatIntensity={1.2}>
      <mesh ref={ref} position={position}>
        <primitive object={geometry} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.15}
          roughness={0.2}
          metalness={0.1}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
}

function WireframeShape({
  position,
  shape,
  color,
  scale = 1,
  speed = 1,
}: {
  position: [number, number, number];
  shape: "torus" | "torusKnot" | "octahedron" | "icosahedron";
  color: string;
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry;
    switch (shape) {
      case "torus":
        geo = new THREE.TorusGeometry(0.5 * scale, 0.18 * scale, 16, 32);
        break;
      case "torusKnot":
        geo = new THREE.TorusKnotGeometry(0.45 * scale, 0.15 * scale, 64, 8);
        break;
      case "octahedron":
        geo = new THREE.OctahedronGeometry(0.45 * scale);
        break;
      case "icosahedron":
        geo = new THREE.IcosahedronGeometry(0.4 * scale);
        break;
    }
    return new THREE.EdgesGeometry(geo);
  }, [shape, scale]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.15 * speed;
      ref.current.rotation.y += delta * 0.25 * speed;
    }
  });

  return (
    <Float speed={1.2 * speed} rotationIntensity={0.2} floatIntensity={0.8}>
      <lineSegments ref={ref} position={position}>
        <primitive object={geometry} />
        <lineBasicMaterial color={color} transparent opacity={0.08} />
      </lineSegments>
    </Float>
  );
}

function Particles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
    }
    return [pos];
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#F97316"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Scene({ reduced }: { reduced: boolean }) {
  const { size } = useThree();
  const isMobile = size.width < 640;

  return (
    <group>
      {!reduced && (
        <>
          <Particles count={isMobile ? 80 : 200} />

          {!isMobile && (
            <>
              <FloatingShape
                position={[-3, 1, -2]}
                shape="torusKnot"
                color="#F97316"
                scale={0.8}
                speed={0.7}
              />
              <FloatingShape
                position={[3.5, -1.5, -3]}
                shape="octahedron"
                color="#F43F5E"
                scale={0.7}
                speed={0.5}
              />
              <WireframeShape
                position={[-2.5, -2, -1]}
                shape="torus"
                color="#A855F7"
                scale={0.9}
                speed={0.6}
              />
              <WireframeShape
                position={[2.8, 2, -4]}
                shape="icosahedron"
                color="#D946EF"
                scale={0.6}
                speed={0.8}
              />
            </>
          )}

          <FloatingShape
            position={[0, -0.5, -5]}
            shape="torus"
            color="#F97316"
            scale={isMobile ? 0.5 : 1}
            speed={0.3}
          />
          <FloatingShape
            position={[1.5, 1.2, -6]}
            shape="icosahedron"
            color="#F43F5E"
            scale={isMobile ? 0.4 : 0.6}
            speed={0.4}
          />
          <WireframeShape
            position={[-1.8, 0.8, -5.5]}
            shape="octahedron"
            color="#A855F7"
            scale={isMobile ? 0.4 : 0.7}
            speed={0.5}
          />
        </>
      )}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} />
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();
  const ref = useRef({ angle: 0 });

  useFrame((_, delta) => {
    ref.current.angle += delta * 0.03;
    camera.position.x = Math.sin(ref.current.angle) * 0.3;
    camera.position.y = Math.sin(ref.current.angle * 0.5) * 0.15;
    camera.lookAt(0, 0, -3);
  });

  return null;
}

export function AmbientScene() {
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 60, near: 0.1, far: 20 }}
        dpr={[0.5, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
        }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene reduced={prefersReduced} />
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
}
