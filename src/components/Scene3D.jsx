import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Billboard,
  Float,
  Html,
  OrbitControls,
  Stars,
  Text,
  useGLTF,
  useTexture,
  useKeyboardControls,
  KeyboardControls
} from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const controlsMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] }
];

const assetPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
const handwritingFont = assetPath('/fonts/Zeyada-Regular.ttf');

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

function ShadowPerson({ person }) {
  return (
    <Billboard position={person.position}>
      <ShadowFigure image={person.image} scale={person.scale} opacity={0.72} />
    </Billboard>
  );
}

function ShadowFigure({ image, scale = 1, opacity = 0.72 }) {
  const texture = useTexture(assetPath(image));

  return (
    <group scale={scale}>
      <mesh>
        <planeGeometry args={[0.78, 1.38]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={opacity}
          alphaTest={0.08}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function ShadowGazeWatcher({ shadowPeople, humanity, onShadowGaze }) {
  const { camera } = useThree();
  const direction = useMemo(() => new THREE.Vector3(), []);
  const toShadow = useMemo(() => new THREE.Vector3(), []);
  const lastHitTime = useRef(0);

  useFrame((state) => {
    if (!shadowPeople.length || !onShadowGaze) return;

    camera.getWorldDirection(direction);
    direction.normalize();

    const isLooking = shadowPeople.some((person) => {
      toShadow.set(
        person.position[0] - camera.position.x,
        person.position[1] - camera.position.y,
        person.position[2] - camera.position.z
      );
      const distance = toShadow.length();
      if (distance > 9) return false;

      toShadow.normalize();
      return direction.dot(toShadow) > 0.955;
    });

    if (!isLooking || state.clock.elapsedTime - lastHitTime.current < 1.35) return;

    lastHitTime.current = state.clock.elapsedTime;
    onShadowGaze({
      damage: Math.max(1, Math.ceil((humanity + 1) / 3))
    });
  });

  return null;
}

function ClickableObject({ object, accent, isNearby }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef();

  const materialColor = hovered || isNearby ? '#f7d48a' : accent;

  return (
    <group position={object.position}>
      <group
        ref={ref}
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
          font={handwritingFont}
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
            font={handwritingFont}
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
    return <CampfireModel />;
  }

  if (kind === 'house') {
    return <CottageModel color={color} />;
  }

  if (kind === 'clerval') {
    return (
      <Billboard position={[0, 1, 0]}>
        <ShadowFigure image="/images/shadow-person-2.png" scale={2} opacity={0.86} />
      </Billboard>
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
    return <OpenBookModel />;
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

function PineTree({ position, scale, rotationY }) {
  const { scene } = useGLTF(assetPath('/models/pine_tree.glb'));
  const tree = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    tree.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [tree]);

  return (
    <primitive
      object={tree}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={[scale, scale, scale]}
    />
  );
}

function CottageModel({ color }) {
  const { scene } = useGLTF(assetPath('/models/CozyMedievalCottage.glb'));
  const cottage = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    cottage.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [cottage]);

  return (
    <group scale={[1.7, 1.7, 1.7]} rotation={[0, Math.PI, 0]}>
      <primitive object={cottage} />
      <pointLight position={[0.65, 0.75, -0.55]} color={color} intensity={0.8} distance={2.5} />
    </group>
  );
}

const houseModelPaths = {
  1: assetPath('/models/medieval_house_1.glb'),
  3: assetPath('/models/medieval_house_3.glb')
};

function MedievalHouseModel({ color, scale = 0.24, rotationY = 0, variant }) {
  const selectedVariant = useMemo(
    () => variant || (Math.random() > 0.5 ? 1 : 3),
    [variant]
  );
  const gltf = useGLTF(houseModelPaths[selectedVariant]);
  const house = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const [diffuseMap, setDiffuseMap] = useState(null);
  const windowX = selectedVariant === 1 ? 0.33 : 0.18;

  useEffect(() => {
    let cancelled = false;
    setDiffuseMap(null);

    gltf.parser
      ?.getDependency('texture', 0)
      .then((texture) => {
        if (cancelled) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
        setDiffuseMap(texture);
      })
      .catch(() => {
        if (!cancelled) setDiffuseMap(null);
      });

    return () => {
      cancelled = true;
    };
  }, [gltf]);

  useEffect(() => {
    house.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (diffuseMap) {
          child.material = new THREE.MeshStandardMaterial({
            map: diffuseMap,
            roughness: 0.82,
            metalness: 0,
            side: THREE.DoubleSide
          });
        } else if (child.material) {
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [house, diffuseMap]);

  return (
    <group rotation={[0, rotationY, 0]}>
      <group scale={[scale, scale, scale]}>
        <primitive object={house} />
      </group>
      <mesh position={[windowX, 1.15, -0.56]}>
        <boxGeometry args={[0.46, 0.28, 0.035]} />
        <meshStandardMaterial
          color="#d7a05f"
          emissive="#b94a22"
          emissiveIntensity={0.72}
          roughness={0.6}
        />
      </mesh>
      <pointLight position={[windowX + 0.02, 1.24, -0.58]} color={color} intensity={1.15} distance={3.4} />
    </group>
  );
}

function OpenBookModel() {
  const { scene } = useGLTF(assetPath('/models/book_open.glb'));
  const book = useMemo(() => scene.clone(true), [scene]);
  const randomRotation = useMemo(() => 1 + Math.random() * 1, []);

  useEffect(() => {
    book.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [book]);

  return (
    <group position={[0, 0.18, 0]} rotation={[0, randomRotation, 0]} scale={[0.026, 0.026, 0.026]}>
      <primitive object={book} />
    </group>
  );
}

function CampfireModel() {
  const { scene } = useGLTF(assetPath('/models/campfire.glb'));
  const campfire = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    campfire.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [campfire]);

  return (
    <group scale={[0.95, 0.95, 0.95]} rotation={[0, -0.35, 0]}>
      <primitive object={campfire} />
      <pointLight position={[0, 0.8, 0]} color="#ff8b2c" intensity={1.8} distance={4.5} />
    </group>
  );
}

function ForestSet() {
  return (
    <group>
      {Array.from({ length: 22 }).map((_, index) => {
        const angle = (index / 22) * Math.PI * 2;
        const radius = 5 + (index % 5) * 0.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const scale = 0.42 + (index % 4) * 0.05;

        return (
          <PineTree
            key={index}
            position={[x, 0, z]}
            rotationY={-angle + (index % 3) * 0.42}
            scale={scale}
          />
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
        <group key={index} position={position}>
          <MedievalHouseModel
            color={accent}
            rotationY={(index % 2) * 0.35 + Math.PI}
            scale={index % 2 ? 0.22 : 0.28}
            variant={index % 2 ? 3 : 1}
          />
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
  if (type === 'forest') return <ForestSet />;
  if (type === 'cave') return <CaveSet accent={accent} />;
  if (type === 'village') return <VillageSet accent={accent} />;
  if (type === 'library') return <LibrarySet accent={accent} />;
  return <ChamberSet accent={accent} />;
}

useGLTF.preload(assetPath('/models/pine_tree.glb'));
useGLTF.preload(assetPath('/models/CozyMedievalCottage.glb'));
useGLTF.preload(assetPath('/models/medieval_house_1.glb'));
useGLTF.preload(assetPath('/models/medieval_house_3.glb'));
useGLTF.preload(assetPath('/models/book_open.glb'));
useGLTF.preload(assetPath('/models/campfire.glb'));
useTexture.preload(assetPath('/images/shadow-person-1.png'));
useTexture.preload(assetPath('/images/shadow-person-2.png'));
useTexture.preload(assetPath('/images/shadow-person-3.png'));

function SceneWorld({
  scene,
  nearbyObjectId,
  onNearbyObjectChange,
  humanity,
  onShadowGaze
}) {
  const { environment, objects, shadowPeople = [], backdropHouses = [] } = scene;

  return (
    <>
      <color attach="background" args={[environment.fog]} />
      <fog attach="fog" args={[environment.fog, 6, 19]} />
      <ambientLight intensity={environment.ambientIntensity ?? 0.45} />
      <directionalLight position={[4, 8, 3]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 2.5, -2]} color={environment.accent} intensity={1.6} distance={8} />
      <Stars radius={45} depth={18} count={900} factor={2.4} fade speed={0.5} />
      <Ground color={environment.color} />
      <EnvironmentSet type={environment.type} accent={environment.accent} />
      {backdropHouses.map((house) => (
        <group key={house.id} position={house.position}>
          <MedievalHouseModel
            color={environment.accent}
            rotationY={house.rotationY}
            scale={house.scale}
            variant={house.variant}
          />
        </group>
      ))}
      {objects?.map((object) => (
        <ClickableObject
          key={object.id}
          object={object}
          accent={environment.accent}
          isNearby={object.id === nearbyObjectId}
        />
      ))}
      {shadowPeople.map((person) => (
        <ShadowPerson key={person.id} person={person} />
      ))}
      <PlayerMovement />
      <ProximityTracker objects={objects || []} onNearbyObjectChange={onNearbyObjectChange} />
      <ShadowGazeWatcher
        shadowPeople={shadowPeople}
        humanity={humanity}
        onShadowGaze={onShadowGaze}
      />
      <OrbitControls enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

export default function Scene3D({
  scene,
  nearbyObjectId,
  onNearbyObjectChange,
  humanity,
  onShadowGaze
}) {
  return (
    <div className="sceneCanvas">
      <KeyboardControls map={controlsMap}>
        <Canvas key={scene.id} shadows camera={{ position: [0, 2.2, 6.2], fov: 58 }}>
          <Suspense fallback={null}>
            <SceneWorld
              scene={scene}
              nearbyObjectId={nearbyObjectId}
              onNearbyObjectChange={onNearbyObjectChange}
              humanity={humanity}
              onShadowGaze={onShadowGaze}
            />
          </Suspense>
        </Canvas>
      </KeyboardControls>
      <div className="controlHint">WASD to move · drag to look · approach objects</div>
    </div>
  );
}
