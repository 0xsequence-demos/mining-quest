import { Clone, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import useSound from "use-sound";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BufferGeometry,
  Euler,
  Group,
  Material,
  Mesh,
  Quaternion,
  Ray,
  Sphere,
  Vector3,
} from "three";
import Rock from "./Rock";

const chunkNames = ["xs", "s", "m", "l"];

function lerp(a: number, b: number, mix: number) {
  return (1 - mix) * a + mix * b;
}

let sharedNow = Date.now() * 0.001;

const spacingRock = 1.6;
const tempSphere = new Sphere(undefined, 1.5);
const tempVec3 = new Vector3();

function indexToCoord(i: number) {
  const x = (~~(i / 4) - 1.5) * spacingRock;
  const y = ((i % 4) - 1.5) * spacingRock;
  return { x, y };
}

const pickaxeHomePosition = new Vector3(0.75, -1.25, 2);
const pickaxeHomeRotation = new Euler(0, -1.25, -0.75);
const pickaxeHomeQuaternion = new Quaternion().setFromEuler(
  pickaxeHomeRotation
);

function MiningGame() {
  const { nodes: nodesPickaxe } = useGLTF("/pickaxe-iron.glb");
  const { nodes: nodesMine } = useGLTF("/rock-mine.glb");
  const [pickaxePosition, setPickaxePosition] = useState(new Vector3());
  const [pickaxeQuaternion, setPickaxeQuaternion] = useState(new Quaternion());
  const [pickaxeAction, setPickaxeAction] = useState(0);
  const myFlash = useRef<Mesh>(null);
  const myPickaxe = useRef<Group>(null);
  const myTunnel1 = useRef<Group>(null);
  const myTunnel2 = useRef<Group>(null);
  const myRailTie1 = useRef<Group>(null);
  const myRailTie2 = useRef<Group>(null);
  const myGroup = useRef<Group>(null);

  useFrame((_state, delta) => {
    sharedNow = Date.now() * 0.001;
    if (!myGroup.current) {
      return;
    }
    if (pickaxeAction > 0) {
      setPickaxeAction(Math.max(0, pickaxeAction - delta * 3));
    }
    if (myPickaxe.current) {
      const a = Math.pow(pickaxeAction, 2);
      myPickaxe.current.position.lerpVectors(
        pickaxeHomePosition,
        pickaxePosition,
        a
      );
      myPickaxe.current.quaternion.slerpQuaternions(
        pickaxeHomeQuaternion,
        pickaxeQuaternion,
        a
      );
    }
    // const now = clock.getElapsedTime();
    if (myFlash.current) {
      const newScale = myFlash.current.scale.x - 6 * delta;
      if (newScale > 0) {
        myFlash.current.visible = true;
        myFlash.current.scale.setScalar(newScale);
      } else {
        myFlash.current.visible = false;
      }
    }
    if (
      myGroup.current.position.z <
      rockDepths.reduce((pv, cv) => Math.min(pv, cv)) - 1
    ) {
      myGroup.current.position.z += delta;
    }
    const posZ = myGroup.current.position.z;
    if (myTunnel1.current && myTunnel2.current) {
      myTunnel1.current.position.z = Math.round(-posZ / 8) * 8;
      myTunnel2.current.position.z = Math.round(-posZ / 8 + 0.5) * 8 - 4;
    }
    if (myRailTie1.current && myRailTie2.current) {
      myRailTie1.current.position.z = Math.round(-posZ / 4) * 4;
      myRailTie2.current.position.z = Math.round(-posZ / 4 + 0.5) * 4 - 2;
    }
  });
  const [rockDepths, setRockDepths] = useState(
    Array.from({ length: 16 }, () => 0)
  );
  const [rockHighlights, setRockHighlights] = useState(
    Array.from({ length: 16 }, () => false)
  );

  const [rockHealths, setRockHealths] = useState(
    Array.from({ length: 16 }, () => 3)
  );

  const [ray, setRay] = useState<Ray>();
  const getInteractionInfo = useCallback(
    (ray: Ray) => {
      if (!myGroup.current) {
        return undefined;
      }
      const candidates: number[] = [];
      const tempFlashPos = new Vector3();
      for (let i = 0; i < rockDepths.length; i++) {
        const { x, y } = indexToCoord(i);
        tempSphere.center.x = x;
        tempSphere.center.y = y;
        tempSphere.center.z = myGroup.current.position.z - rockDepths[i];
        if (
          ray.intersectSphere(tempSphere, tempVec3) &&
          Math.abs(tempVec3.x) < 2.4 &&
          Math.abs(tempVec3.y) < 2.6 &&
          tempSphere.center.z > -1.5
        ) {
          candidates.push(i);
          tempFlashPos.add(tempVec3);
        }
      }
      tempFlashPos.divideScalar(candidates.length);
      tempFlashPos.z -= 5;
      tempFlashPos.multiplyScalar(0.9);
      tempFlashPos.z += 5;
      return {
        candidates,
        flashPos: tempFlashPos,
      };
    },
    [rockDepths]
  );

  const makeChunks = useCallback(
    (i: number, depth: number, num: number) => {
      if (!myGroup.current) {
        return;
      }
      const { x, y } = indexToCoord(i);
      for (let i = 0; i < num; i++) {
        const m = nodesMine[
          `chunk-${chunkNames[~~(Math.random() * Math.random() * 4)]}`
        ] as Mesh<BufferGeometry, Material>;
        const meshPrize = new Mesh(m.geometry, m.material);
        myGroup.current.add(meshPrize);
        meshPrize.scale.setScalar(4);
        meshPrize.rotation.set(
          Math.random() * 7,
          Math.random() * 7,
          Math.random() * 7
        );
        meshPrize.userData.origRot = meshPrize.rotation.clone();
        meshPrize.userData.spin = new Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        );
        meshPrize.position.set(x, y, depth);
        meshPrize.userData.origPos = meshPrize.position.clone();
        meshPrize.userData.startTime = sharedNow;
        const a = Math.random() * Math.PI * 2;
        meshPrize.userData.spreadVecX = Math.cos(a) * 4;
        meshPrize.userData.spreadVecY = Math.sin(a) * 4;
        meshPrize.onBeforeRender = () => {
          meshPrize.position.z = meshPrize.userData.origPos.z;
          const elapsed = sharedNow - meshPrize.userData.startTime;
          meshPrize.position.z += elapsed * elapsed * 25;
          meshPrize.position.x = lerp(
            meshPrize.userData.origPos.x,
            meshPrize.userData.spreadVecX,
            elapsed
          );
          meshPrize.position.y = lerp(
            meshPrize.userData.origPos.y,
            meshPrize.userData.spreadVecY,
            elapsed
          );
          meshPrize.position.y = lerp(
            meshPrize.position.y,
            -meshPrize.userData.origPos.y * 4 - 16,
            elapsed * elapsed
          );
          meshPrize.position.x = lerp(
            meshPrize.position.x,
            0,
            elapsed * elapsed
          );
          meshPrize.rotation.copy(meshPrize.userData.origRot);
          meshPrize.rotation.x += meshPrize.userData.spin.x * elapsed * 30;
          meshPrize.rotation.y += meshPrize.userData.spin.y * elapsed * 30;
          meshPrize.rotation.z += meshPrize.userData.spin.z * elapsed * 30;
        };
        setTimeout(() => {
          if (meshPrize.parent) {
            meshPrize.parent.remove(meshPrize);
          }
        }, 500);
      }
    },
    [nodesMine, rockDepths]
  );

  useEffect(() => {
    if (!myGroup.current || !ray) {
      return;
    }
    const info = getInteractionInfo(ray);
    if (!info) {
      return;
    }
    const newRockHighlights = rockHighlights.slice();
    for (let i = 0; i < rockHighlights.length; i++) {
      newRockHighlights[i] = info.candidates.includes(i);
    }
    // rockHighlights[i] = !!ray.intersectSphere(tempSphere, tempVec3);
    let changed = false;
    for (let i = 0; i < rockHighlights.length; i++) {
      if (rockHighlights[i] !== newRockHighlights[i]) {
        changed = true;
        break;
      }
    }
    if (changed) {
      setRockHighlights(newRockHighlights);
    }
  }, [getInteractionInfo, ray, rockHighlights]);
  const [sfxLight1] = useSound("/audio/pickaxe-light1.mp3");
  const [sfxLight2] = useSound("/audio/pickaxe-light2.mp3");
  const [sfxLight3] = useSound("/audio/pickaxe-light3.mp3");
  const [sfxLight4] = useSound("/audio/pickaxe-light4.mp3");
  const [sfxMedium1] = useSound("/audio/pickaxe-medium1.mp3");
  const [sfxMedium2] = useSound("/audio/pickaxe-medium2.mp3");
  const [sfxMedium3] = useSound("/audio/pickaxe-medium3.mp3");
  const [sfxMedium4] = useSound("/audio/pickaxe-medium4.mp3");
  const [sfxMedium5] = useSound("/audio/pickaxe-medium5.mp3");
  const [sfxMedium6] = useSound("/audio/pickaxe-medium6.mp3");
  const [sfxHeavy1] = useSound("/audio/pickaxe-heavy1.mp3");
  const [sfxHeavy2] = useSound("/audio/pickaxe-heavy2.mp3");
  return (
    <>
      <mesh
        visible
        position={[0, 0, 3.75]}
        rotation={[0, 0, 0]}
        onPointerMove={(ev) => {
          setRay(ev.ray.clone());
        }}
        onPointerDown={(ev) => {
          setRay(ev.ray.clone());
          if (!myGroup.current) {
            return;
          }
          const info = getInteractionInfo(ev.ray);
          if (!info) {
            return;
          }
          let cracked = false;
          for (const i of info.candidates) {
            if (rockHealths[i] > 1) {
              rockHealths[i]--;
              makeChunks(i, -rockDepths[i], 1);
            } else {
              makeChunks(i, -rockDepths[i], 5);
              rockDepths[i]++;
              rockHealths[i] = 3;
              cracked = true;
            }
          }
          if (info.candidates.length > 0) {
            if (cracked) {
              [sfxHeavy1, sfxHeavy2][~~(Math.random() * 2)]();
            } else if (info.candidates.length === 1) {
              [sfxLight1, sfxLight2, sfxLight3, sfxLight4][
                ~~(Math.random() * 4)
              ]();
            } else {
              [
                sfxMedium1,
                sfxMedium2,
                sfxMedium3,
                sfxMedium4,
                sfxMedium5,
                sfxMedium6,
              ][~~(Math.random() * 6)]();
            }
            if (myFlash.current) {
              myFlash.current.scale.setScalar(0.5);
              myFlash.current.position.copy(info.flashPos);
            }
            setRockHealths(rockHealths.slice());
            setRockDepths(rockDepths.slice());
            const mpa = myPickaxe.current;
            if (mpa) {
              mpa.position.copy(info.flashPos);
              mpa.lookAt(new Vector3(0, 0, 3));
              mpa.rotateY(Math.PI * -0.5);
              mpa.translateY(-1);
              mpa.translateZ(-0.2);
              setPickaxePosition(mpa.position.clone());
              setPickaxeQuaternion(mpa.quaternion.clone());
              setPickaxeAction(1);
              // mpa.rotateX(Math.PI * -0.35);
            }
          }
        }}
      >
        <planeGeometry args={[10, 10, 1, 1]} />
        <meshStandardMaterial
          color="green"
          transparent
          opacity={0.15}
          visible={false}
        />
      </mesh>
      <Clone
        ref={myPickaxe}
        scale={[2, 2, 2]}
        position={pickaxeHomePosition}
        rotation={pickaxeHomeRotation}
        object={nodesPickaxe["iron-pickaxe"]}
      />
      {/* <ambientLight intensity={0.25} /> */}
      <pointLight position={[0, 0, 5]} intensity={70} color={[1, 0.7, 0.3]} />
      <mesh
        ref={myFlash}
        position={[0, 0, 2]}
        scale={[0.3, 0.3, 0.3]}
        rotation={[Math.PI * 0.5, 0, 0]}
        // scale={[1, 1, 1]}
        geometry={(nodesMine["flash"] as Mesh).geometry}
      >
        <meshBasicMaterial
          transparent
          opacity={1}
          color={[3.25, 2.75, 1.25]}
          // emissive={highlights[i] ? [0.125, 0.25, 0] : [0, 0, 0]}
        />
      </mesh>
      <Clone object={nodesMine["rail-metal"]} position={[0, -2.7, 2.5]} />
      <group ref={myGroup} position={[0, 0, -1]}>
        <Clone
          ref={myRailTie1}
          // scale={[1, 1, 1]}
          position={[0.7, -3, 0]}
          object={nodesMine["rail-tie"]}
        />
        <Clone
          ref={myRailTie2}
          // scale={[1, 1, 1]}
          position={[0.7, -3, 0]}
          rotation={[Math.PI, Math.PI * 0.5, 0]}
          object={nodesMine["rail-tie"]}
        />
        <Clone
          ref={myTunnel1}
          object={nodesMine["tunnel"]}
          position={[0, 0, 0]}
        />
        <Clone
          ref={myTunnel2}
          object={nodesMine["tunnel"]}
          position={[0, 0, 0]}
        />
        {Array.from({ length: 16 }, (_, i) => (
          <Rock
            key={i}
            index={i}
            health={rockHealths[i]}
            depth={rockDepths[i]}
            highlight={rockHighlights[i]}
          />
        ))}
      </group>
    </>
  );
}

useGLTF.preload("/pickaxe-iron.glb");

export default MiningGame;
