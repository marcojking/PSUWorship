"use client";

import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Procedural cross ring geometry                                     */
/* ------------------------------------------------------------------ */

/** Helix path for the wrap-around ring band (~1.15 turns) */
class SpiralCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radius: number,
    private height: number,
    private turns: number,
  ) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns;
    return target.set(
      this.radius * Math.cos(angle),
      (t - 0.5) * this.height,
      this.radius * Math.sin(angle),
    );
  }
}

/** Cross-shaped 2D profile for ExtrudeGeometry */
function crossShape(size: number, arm: number): THREE.Shape {
  const s = size / 2;
  const a = arm / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-a, -s);
  shape.lineTo(a, -s);
  shape.lineTo(a, -a);
  shape.lineTo(s, -a);
  shape.lineTo(s, a);
  shape.lineTo(a, a);
  shape.lineTo(a, s);
  shape.lineTo(-a, s);
  shape.lineTo(-a, a);
  shape.lineTo(-s, a);
  shape.lineTo(-s, -a);
  shape.lineTo(-a, -a);
  shape.closePath();
  return shape;
}

/** Build all ring geometries into a single group */
function useRingGeometries() {
  return useMemo(() => {
    // --- Band (spiral tube) ---
    const curve = new SpiralCurve(0.85, 0.22, 1.15);
    const bandGeo = new THREE.TubeGeometry(curve, 128, 0.055, 16, false);

    // --- Crosses ---
    const crossGeo = new THREE.ExtrudeGeometry(crossShape(0.28, 0.10), {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    // Center the extrusion so depth is centered
    crossGeo.translate(0, 0, -0.045 / 2);

    // Position crosses at tube ends, oriented outward
    const startPt = curve.getPoint(0);
    const startTan = curve.getTangent(0);
    const endPt = curve.getPoint(1);
    const endTan = curve.getTangent(1);

    // Build matrices to place crosses perpendicular to the tube at each end
    function orientMatrix(pos: THREE.Vector3, tangent: THREE.Vector3, flip: boolean) {
      // "outward" direction = radial from center
      const radial = new THREE.Vector3(pos.x, 0, pos.z).normalize();
      const up = new THREE.Vector3().crossVectors(tangent, radial).normalize();
      if (flip) up.negate();
      const mat = new THREE.Matrix4();
      mat.makeBasis(tangent.normalize(), up, radial);
      mat.setPosition(pos.clone().add(radial.clone().multiplyScalar(0.0)));
      return mat;
    }

    const cross1Geo = crossGeo.clone();
    cross1Geo.applyMatrix4(orientMatrix(startPt, startTan, false));

    const cross2Geo = crossGeo.clone();
    cross2Geo.applyMatrix4(orientMatrix(endPt, endTan, true));

    return { bandGeo, cross1Geo, cross2Geo };
  }, []);
}

/* ------------------------------------------------------------------ */
/*  Interactive 3D ring mesh                                           */
/* ------------------------------------------------------------------ */

function RingModel() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const target = useRef({ x: 0, y: 0 });
  const { bandGeo, cross1Geo, cross2Geo } = useRingGeometries();

  // Gold / brushed brass material
  const goldMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#D4A843"),
        metalness: 0.92,
        roughness: 0.28,
        clearcoat: 0.2,
        clearcoatRoughness: 0.15,
        envMapIntensity: 1.4,
      }),
    [],
  );

  useFrame(({ pointer, clock }, delta) => {
    if (!groupRef.current) return;

    if (hovered) {
      target.current.y = pointer.x * 0.8;
      target.current.x = -pointer.y * 0.5;
    } else {
      const t = clock.elapsedTime;
      target.current.y = t * 0.3; // slow continuous spin when idle
      target.current.x = Math.sin(t * 0.4) * 0.15;
    }

    const speed = hovered ? 5 : 2;
    groupRef.current.rotation.y = hovered
      ? THREE.MathUtils.lerp(groupRef.current.rotation.y, target.current.y, delta * speed)
      : THREE.MathUtils.lerp(groupRef.current.rotation.y, target.current.y, delta * speed);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      target.current.x,
      delta * speed,
    );
  });

  return (
    <group
      ref={groupRef}
      // Tilt the ring so it faces the camera at a natural angle
      rotation={[0.5, 0, 0.15]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh geometry={bandGeo} material={goldMat} />
      <mesh geometry={cross1Geo} material={goldMat} />
      <mesh geometry={cross2Geo} material={goldMat} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Outer card wrapper                                                 */
/* ------------------------------------------------------------------ */

interface Ring3DCardProps {
  name: string;
  price: number; // cents
  href: string;
}

export default function Ring3DCard({ name, price, href }: Ring3DCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
        <Canvas
          camera={{ position: [0, 0.3, 2.8], fov: 40 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[4, 5, 6]} intensity={1.5} castShadow />
            <directionalLight position={[-3, -2, 4]} intensity={0.4} />
            <pointLight position={[0, 2, 1]} intensity={0.3} color="#ffe4b5" />
            <Environment preset="city" />
            <RingModel />
          </Suspense>
        </Canvas>
      </div>

      <div className="px-1 pt-3">
        <h3 className="text-sm font-semibold group-hover:text-secondary transition-colors">
          {name}
        </h3>
        <p className="text-xs text-muted">
          ${(price / 100).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
