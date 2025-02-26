import { Clone, useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { BufferGeometry, Group, Mesh, MeshStandardMaterial } from "three";

const size = 0.75;

export default function Gem() {
  const { nodes: nodesGame } = useGLTF("/gem.glb");

  const gemMesh = nodesGame["gem"] as Mesh<
    BufferGeometry,
    MeshStandardMaterial
  >;
  const myGem = useRef<Group>(null);
  return <Clone
    ref={myGem}
    scale={[size, size, size]}
    position={[0,0,0]}
    rotation={[0,0,0]}
    object={gemMesh}
  >
    <pointLight position={[0, 0, 0]} intensity={30} color={[1, 0.7, 0.3]} />
  </Clone>
}
