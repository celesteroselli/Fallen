import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Billboard,
  Float,
  Html,
  OrbitControls,
  Stars,
  Text,
  useKeyboardControls,
  KeyboardControls
} from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const controlsMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] }
];

function Ground({ color }) {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[18, 72]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function PlayerMovement() {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  const velocity = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const side = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const keys = getKeys();
    direction.set(0, 0, 0);
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    side.crossVectors(camera.up, direction).normalize();

    velocity.set(0, 0, 0);
    if (keys.forward) velocity.add(direction);
    if (keys.backward) velocity.sub(direction);
    if (keys.left) velocity.add(side);
    if (keys.right) velocity.sub(side);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().multiplyScalar(delta * 4);
      camera.position.add(velocity);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -8, 8);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -8, 8);
    }
  });

  return null;
}

function ProximityTracker({ objects, onNearbyObjectChange }) {
  const { camera } = useThree();
  const lastNearby = useRef('');

  useFrame(() => {
    let nearest = null;
    let nearestDistance = Infinity;

    objects.forEach((object) => {
      const distance = Math.hypot(
        camera.position.x - object.position[0],
        camera.position.z - object.position[2]
      );

      if (distance < nearestDistance) {
        nearest = object;
        nearestDistance = distance;
      }
    });

    const nextInfo =
      nearest && nearestDistance <= 3.2
        ? { id: nearest.id, distance: Number(nearestDistance.toFixed(1)) }
        : null;
    const nextKey = nextInfo ? `${nextInfo.id}:${nextInfo.distance}` : 'none';

    if (lastNearby.current !== nextKey) {
      lastNearby.current = nextKey;
      onNearbyObjectChange(nextInfo);
    }
  });

  return null;
}

function ClickableObject({ object, accent, isNearby }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += hovered ? 0.018 : 0.006;
    ref.current.position.y += Math.sin(state.clock.elapsedTime * 2 + object.position[0]) * 0.0015;
  });

  const materialColor = hovered || isNearby ? '#f7d48a' : accent;

  return (
    <group position={object.position}>
      <group
        ref={ref}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <ObjectMesh kind={object.kind} color={materialColor} />
      </group>
      {isNearby && (
        <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.85, 1.05, 42]} />
          <meshStandardMaterial color="#f7d48a" emissive="#f7d48a" emissiveIntensity={0.45} transparent opacity={0.72} />
        </mesh>
      )}
      <Billboard position={[0, 1.1, 0]}>
        <Text
          fontSize={0.18}
          color="#f7edd0"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#120d0b"
        >
          {object.label}
        </Text>
      </Billboard>
      {!isNearby && (
        <Billboard position={[0, 1.42, 0]}>
          <Text
            fontSize={0.13}
            color="#d8bd81"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.012}
            outlineColor="#120d0b"
          >
            {object.prompt}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function ObjectMesh({ kind, color }) {
  if (kind === 'fire') {
    return (
      <group>
        <mesh castShadow position={[-0.22, 0.05, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.08, 0.08, 0.75, 8]} />
          <meshStandardMaterial color="#3c2115" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0.22, 0.05, 0]} rotation-z={-Math.PI / 2}>
          <cylinderGeometry args={[0.08, 0.08, 0.75, 8]} />
          <meshStandardMaterial color="#3c2115" roughness={0.85} />
        </mesh>
        <Float speed={2.2} rotationIntensity={0.2} floatIntensity={0.22}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <coneGeometry args={[0.38, 0.9, 18]} />
            <meshStandardMaterial color="#ff8b2c" emissive="#ff6b19" emissiveIntensity={1.1} transparent opacity={0.82} />
          </mesh>
        </Float>
      </group>
    );
  }

  if (kind === 'house') {
    return (
      <group>
        <mesh castShadow position={[0, 0.45, 0]}>
          <boxGeometry args={[1.7, 0.9, 1.35]} />
          <meshStandardMaterial color="#3a2b25" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 1.15, 0]} rotation-z={Math.PI / 4}>
          <boxGeometry args={[1.45, 1.45, 1.4]} />
          <meshStandardMaterial color={color} roughness={0.86} />
        </mesh>
        <mesh position={[0.52, 0.55, -0.7]}>
          <boxGeometry args={[0.36, 0.28, 0.04]} />
          <meshStandardMaterial color="#ffd98f" emissive="#ffb35d" emissiveIntensity={0.45} />
        </mesh>
      </group>
    );
  }

  if (kind === 'clerval') {
    return (
      <group>
        <mesh castShadow position={[0, 0.45, 0]}>
          <capsuleGeometry args={[0.24, 0.85, 8, 16]} />
          <meshStandardMaterial color="#2b2f3b" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 1.16, 0]}>
          <sphereGeometry args={[0.23, 18, 18]} />
          <meshStandardMaterial color="#d6b28b" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (kind === 'crystal') {
    return (
      <mesh castShadow>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
    );
  }

  if (kind === 'altar') {
    return (
      <group>
        <mesh castShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.7, 0.35, 8]} />
          <meshStandardMaterial color="#6e6671" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.36, 0.45, 0.2, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} />
        </mesh>
      </group>
    );
  }

  if (kind === 'book') {
    return (
      <mesh castShadow rotation={[0.15, 0.4, 0]}>
        <boxGeometry args={[0.75, 0.14, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    );
  }

  if (kind === 'hourglass') {
    return (
      <group>
        <mesh castShadow position={[0, 0.25, 0]}>
          <coneGeometry args={[0.28, 0.55, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.65} />
        </mesh>
        <mesh castShadow position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.28, 0.55, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.65} />
        </mesh>
      </group>
    );
  }

  if (kind === 'pool') {
    return (
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.75, 40]} />
        <meshStandardMaterial color="#05020a" emissive={color} emissiveIntensity={0.18} metalness={0.4} roughness={0.2} />
      </mesh>
    );
  }

  if (kind === 'bell') {
    return (
      <mesh castShadow>
        <coneGeometry args={[0.42, 0.75, 28, 1, true]} />
        <meshStandardMaterial color="#d8a84e" metalness={0.5} roughness={0.25} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    );
  }

  if (kind === 'well') {
    return (
      <mesh castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.6, 18, 1, true]} />
        <meshStandardMaterial color="#6b6964" roughness={0.9} />
      </mesh>
    );
  }

  if (kind === 'sign') {
    return (
      <group>
        <mesh castShadow position={[0, 0.15, 0]}>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshStandardMaterial color="#3b2418" />
        </mesh>
        <mesh castShadow position={[0, 0.62, 0]}>
          <boxGeometry args={[0.95, 0.42, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      </group>
    );
  }

  if (kind === 'stone') {
    return (
      <mesh castShadow>
        <dodecahedronGeometry args={[0.48, 0]} />
        <meshStandardMaterial color="#6e7d68" roughness={0.9} emissive={color} emissiveIntensity={0.08} />
      </mesh>
    );
  }

  return (
    <mesh castShadow>
      <boxGeometry args={[0.75, 0.55, 0.55]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function ForestSet({ accent }) {
  return (
    <group>
      {Array.from({ length: 22 }).map((_, index) => {
        const angle = (index / 22) * Math.PI * 2;
        const radius = 5 + (index % 5) * 0.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const scale = 0.8 + (index % 4) * 0.18;

        return (
          <group key={index} position={[x, 0, z]} scale={scale}>
            <mesh castShadow position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.12, 0.18, 1.6, 7]} />
              <meshStandardMaterial color="#2e2018" />
            </mesh>
            <mesh castShadow position={[0, 1.8, 0]}>
              <coneGeometry args={[0.7, 1.8, 8]} />
              <meshStandardMaterial color={index % 3 === 0 ? accent : '#243f25'} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CaveSet({ accent }) {
  return (
    <group>
      {Array.from({ length: 14 }).map((_, index) => {
        const angle = (index / 14) * Math.PI * 2;
        const radius = 5.2 + (index % 3) * 0.65;
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, 1.2, Math.sin(angle) * radius]} castShadow>
            <coneGeometry args={[0.55 + (index % 4) * 0.14, 2.8, 8]} />
            <meshStandardMaterial color={index % 4 === 0 ? accent : '#2a2d34'} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function VillageSet({ accent }) {
  return (
    <group>
      {[
        [-4, 0, -2.8],
        [3.8, 0, -2.2],
        [-3.2, 0, 3.2],
        [4, 0, 2.7]
      ].map((position, index) => (
        <group key={index} position={position} rotation-y={(index % 2) * 0.35}>
          <mesh castShadow position={[0, 0.55, 0]}>
            <boxGeometry args={[1.7, 1.1, 1.35]} />
            <meshStandardMaterial color="#3a2b25" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 1.35, 0]} rotation-z={Math.PI / 4}>
            <boxGeometry args={[1.55, 1.55, 1.45]} />
            <meshStandardMaterial color={index === 1 ? accent : '#1d1715'} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function LibrarySet({ accent }) {
  return (
    <group>
      {Array.from({ length: 8 }).map((_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <group key={index} position={[Math.cos(angle) * 4.9, 0, Math.sin(angle) * 4.9]} rotation-y={-angle}>
            <mesh castShadow position={[0, 1.1, 0]}>
              <boxGeometry args={[1.15, 2.2, 0.35]} />
              <meshStandardMaterial color="#281f34" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.15, -0.2]}>
              <boxGeometry args={[0.82, 1.72, 0.05]} />
              <meshStandardMaterial color={index % 2 ? accent : '#7b5a9a'} emissive={accent} emissiveIntensity={0.05} />
            </mesh>
          </group>
        );
      })}
      <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.6}>
        <mesh position={[0, 2.3, -1.2]} castShadow>
          <torusGeometry args={[1.3, 0.035, 8, 80]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      </Float>
    </group>
  );
}

function ChamberSet({ accent }) {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, index) => {
        const x = (index - 2) * 1.25;
        return (
          <group key={index} position={[x, 2.5, -3.8]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
              <meshStandardMaterial color="#6b5f54" />
            </mesh>
            <mesh castShadow position={[0, -0.72, 0]}>
              <coneGeometry args={[0.35, 0.55, 26, 1, true]} />
              <meshStandardMaterial color={index === 2 ? '#d8a84e' : accent} metalness={0.3} roughness={0.25} />
            </mesh>
          </group>
        );
      })}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, -1.4]}>
        <ringGeometry args={[1.2, 1.35, 60]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.28} />
      </mesh>
    </group>
  );
}

function EnvironmentSet({ type, accent }) {
  if (type === 'forest') return <ForestSet accent={accent} />;
  if (type === 'cave') return <CaveSet accent={accent} />;
  if (type === 'village') return <VillageSet accent={accent} />;
  if (type === 'library') return <LibrarySet accent={accent} />;
  return <ChamberSet accent={accent} />;
}

function SceneWorld({ scene, nearbyObjectId, onNearbyObjectChange }) {
  const { environment, objects } = scene;

  return (
    <>
      <color attach="background" args={[environment.fog]} />
      <fog attach="fog" args={[environment.fog, 6, 19]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 8, 3]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 2.5, -2]} color={environment.accent} intensity={1.6} distance={8} />
      <Stars radius={45} depth={18} count={900} factor={2.4} fade speed={0.5} />
      <Ground color={environment.color} />
      <EnvironmentSet type={environment.type} accent={environment.accent} />
      {objects?.map((object) => (
        <ClickableObject
          key={object.id}
          object={object}
          accent={environment.accent}
          isNearby={object.id === nearbyObjectId}
        />
      ))}
      <PlayerMovement />
      <ProximityTracker objects={objects || []} onNearbyObjectChange={onNearbyObjectChange} />
      <OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

export default function Scene3D({ scene, nearbyObjectId, onNearbyObjectChange }) {
  return (
    <div className="sceneCanvas">
      <KeyboardControls map={controlsMap}>
        <Canvas key={scene.id} shadows camera={{ position: [0, 2.2, 6.2], fov: 58 }}>
          <Suspense fallback={null}>
            <SceneWorld
              scene={scene}
              nearbyObjectId={nearbyObjectId}
              onNearbyObjectChange={onNearbyObjectChange}
            />
          </Suspense>
        </Canvas>
      </KeyboardControls>
      <div className="controlHint">WASD to move · drag to look · approach objects</div>
    </div>
  );
}
