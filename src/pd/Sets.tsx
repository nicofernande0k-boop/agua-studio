import { useMemo } from "react";
import * as THREE from "three";
import { clamp01, crearAzar, type Vec3 } from "../lib/anim";
import { Instancias, type Instancia } from "../three/Instancias";
import { CREMA, ROJO } from "./Escena";

/**
 * PATRIA EN DISPUTA — decorados. Formas sobrias, materiales mate, luz que
 * construye el espacio. Nada de detalle superfluo.
 */

const mat = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.7, ...o });

/** Mancha suave para el vapor. */
function texturaHumo() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,0.5)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Ciudad de monolitos oscuros con ventanas encendidas aquí y allá. */
export function Monolitos({ semilla = 3, calor = 0, encendidas = 0.12, ancho = 70, fondo = 90 }: { semilla?: number; calor?: number; encendidas?: number; ancho?: number; fondo?: number }) {
  const r = useMemo(() => {
    const az = crearAzar(semilla);
    const cuerpos: Instancia[] = [];
    const ventanas: { p: Vec3; s: Vec3; ry: number; k: number }[] = [];
    for (let x = -ancho / 2; x < ancho / 2; x += az.entre(7, 11)) {
      for (const lado of [-1, 1]) {
        const w = az.entre(6, 9);
        const d = az.entre(6, 10);
        const h = az.entre(14, 46);
        const z = -fondo / 2 + az.entre(0, fondo);
        const px = lado * az.entre(7, 30) + x * 0.15;
        cuerpos.push({ p: [px, h / 2, z], s: [w, h, d], c: "#1a1a1c" });
        const caraZ = z + d / 2 + 0.03;
        for (let y = 2.5; y < h - 1; y += 2.6) {
          for (let u = -w / 2 + 1; u < w / 2 - 0.6; u += 1.6) {
            if (az.n() < 0.55) ventanas.push({ p: [px + u, y, caraZ], s: [0.9, 1.3, 0.05], ry: 0, k: az.n() });
          }
        }
      }
    }
    return { cuerpos, ventanas, caja: new THREE.BoxGeometry(1, 1, 1), muro: mat({ color: "#ffffff", roughness: 0.85 }), vidrio: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }) };
  }, [semilla, ancho, fondo]);
  const frio = new THREE.Color("#3d4a5a");
  const calido = new THREE.Color("#ffc47a");
  const apagada = new THREE.Color("#121315");
  const items: Instancia[] = r.ventanas.map((v) => {
    const prendida = v.k < encendidas + calor * 0.5;
    const c = prendida ? frio.clone().lerp(calido, clamp01(calor * 1.4 - v.k * 0.6)) : apagada;
    return { p: v.p, s: v.s, ry: 0, c: `#${c.getHexString()}` };
  });
  return (
    <group>
      <Instancias items={r.cuerpos} geometria={r.caja} material={r.muro} />
      <Instancias items={items} geometria={r.caja} material={r.vidrio} sombra={false} recibe={false} />
    </group>
  );
}

/** Andén de subte con la línea roja de seguridad y un tren que pasa (`tren` 0..1). */
export function Anden({ tren }: { tren: number }) {
  const r = useMemo(
    () => ({
      anden: mat({ color: "#2a2a2c", roughness: 0.5 }),
      linea: new THREE.MeshBasicMaterial({ color: ROJO, toneMapped: false }),
      columna: mat({ color: "#3a3a3d", roughness: 0.6 }),
      tren: mat({ color: "#26272b", roughness: 0.35, metalness: 0.6 }),
      luzTren: new THREE.MeshBasicMaterial({ color: "#f3ead9", toneMapped: false }),
    }),
    [],
  );
  const x = -90 + tren * 180;
  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={r.anden} receiveShadow>
        <boxGeometry args={[80, 1, 8]} />
      </mesh>
      <mesh position={[0, 1.005, 3.5]} material={r.linea}>
        <boxGeometry args={[80, 0.01, 0.18]} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => -32 + i * 8).map((cx) => (
        <mesh key={cx} position={[cx, 4, -2.5]} material={r.columna} castShadow>
          <boxGeometry args={[0.7, 6, 0.7]} />
        </mesh>
      ))}
      {tren > 0 && tren < 1 ? (
        <group position={[x, 2.2, 6.4]}>
          <mesh material={r.tren} castShadow>
            <boxGeometry args={[60, 3.2, 3]} />
          </mesh>
          {Array.from({ length: 24 }, (_, i) => -28 + i * 2.4).map((wx) => (
            <mesh key={wx} position={[wx, 0.5, -1.52]} material={r.luzTren}>
              <boxGeometry args={[1.6, 1.0, 0.02]} />
            </mesh>
          ))}
          <pointLight position={[0, 0.5, -3]} intensity={50} distance={14} color="#f3ead9" />
        </group>
      ) : null}
    </group>
  );
}

/** Piso que se parte entre dos personas: `apertura` en metros, resplandor rojo en la grieta. */
export function Grieta({ apertura }: { apertura: number }) {
  const r = useMemo(() => {
    const forma = (lado: 1 | -1) => {
      const s = new THREE.Shape();
      const pts: [number, number][] = [];
      for (let i = 0; i <= 20; i++) pts.push([Math.sin(i * 1.7) * 0.25 + Math.sin(i * 0.6) * 0.4, -15 + i * 1.5]);
      s.moveTo(lado * 20, -15);
      pts.forEach(([x, z]) => s.lineTo(x, z));
      s.lineTo(lado * 20, 15);
      s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false });
      g.rotateX(Math.PI / 2);
      g.translate(0, 0.02, 0);
      return g;
    };
    return {
      izq: forma(-1),
      der: forma(1),
      losa: mat({ color: "#18181a", roughness: 0.45, metalness: 0.15 }),
      brasa: new THREE.MeshBasicMaterial({ color: ROJO, toneMapped: false }),
    };
  }, []);
  return (
    <group>
      <mesh geometry={r.izq} material={r.losa} position={[-apertura / 2, 0, 0]} receiveShadow />
      <mesh geometry={r.der} material={r.losa} position={[apertura / 2, 0, 0]} receiveShadow />
      {apertura > 0.01 ? (
        <>
          <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} material={r.brasa}>
            <planeGeometry args={[Math.max(0.05, apertura + 0.6), 30]} />
          </mesh>
          <pointLight position={[0, -0.6, 0]} color={ROJO} intensity={18 * clamp01(apertura)} distance={8} />
        </>
      ) : null}
    </group>
  );
}

/** Escalera monumental hacia una cima solitaria. */
export function Escalera({ escalones = 26, alto = 0.5, fondo = 1.1 }: { escalones?: number; alto?: number; fondo?: number }) {
  const r = useMemo(() => {
    const items: Instancia[] = Array.from({ length: escalones }, (_, i) => ({ p: [0, alto * (i + 0.5), -i * fondo], s: [9, alto, fondo + 0.02], c: "#1d1d1f" }));
    items.push({ p: [0, alto * escalones + 0.6, -escalones * fondo - 1], s: [2.4, 1.2, 2.4], c: "#2a2a2c" });
    return { items, caja: new THREE.BoxGeometry(1, 1, 1), m: mat({ color: "#ffffff", roughness: 0.5 }) };
  }, [escalones, alto, fondo]);
  return <Instancias items={r.items} geometria={r.caja} material={r.m} />;
}
export const cimaEscalera = (escalones = 26, alto = 0.5, fondo = 1.1): Vec3 => [0, alto * escalones + 1.2, -escalones * fondo - 1];

/** Casa dañada: paredes en pie, techo caído. */
export function CasaDanada() {
  const r = useMemo(() => ({ pared: mat({ color: "#3b3631" }), techo: mat({ color: "#2b2622" }), escombro: mat({ color: "#4a433b", flatShading: true }) }), []);
  return (
    <group>
      <mesh position={[0, 1.5, -3]} material={r.pared} castShadow receiveShadow><boxGeometry args={[7, 3, 0.25]} /></mesh>
      <mesh position={[-3.4, 1.5, -1]} material={r.pared} castShadow><boxGeometry args={[0.25, 3, 4]} /></mesh>
      <mesh position={[3.4, 1.0, -1.6]} rotation={[0, 0, 0.25]} material={r.pared} castShadow><boxGeometry args={[0.25, 2.2, 2.8]} /></mesh>
      <mesh position={[0.8, 1.4, -1.2]} rotation={[0.2, 0.1, -0.45]} material={r.techo} castShadow><boxGeometry args={[6, 0.18, 4]} /></mesh>
      {[[-1.5, 0.3, 0.5], [1.8, 0.25, 1.2], [0.2, 0.2, 1.8], [2.6, 0.3, 0.3]].map((p, i) => (
        <mesh key={i} position={p as Vec3} rotation={[i, i * 2, 0]} material={r.escombro} castShadow><dodecahedronGeometry args={[0.35 + i * 0.05, 0]} /></mesh>
      ))}
    </group>
  );
}

/** Caja que se pasa de mano en mano. */
export function Caja({ p }: { p: Vec3 }) {
  return (
    <mesh position={p} castShadow>
      <boxGeometry args={[0.45, 0.32, 0.35]} />
      <meshStandardMaterial color="#b08a5a" roughness={0.8} />
    </mesh>
  );
}

/** Comedor comunitario: mesa larga, ollas, platos humeantes y lámparas cálidas. */
export function Comedor({ frame, largo = 12 }: { frame: number; largo?: number }) {
  const r = useMemo(() => {
    const az = crearAzar(4);
    const platos: Instancia[] = [];
    for (let x = -largo / 2 + 0.6; x < largo / 2 - 0.4; x += 0.8) for (const z of [-0.35, 0.35]) platos.push({ p: [x, 0.79, z], s: [0.24, 0.04, 0.24], c: "#ece4d4" });
    const vapor = Array.from({ length: 70 }, () => ({ x: az.entre(-largo / 2, largo / 2), z: az.entre(-0.4, 0.4), o: az.n(), v: az.entre(0.6, 1) }));
    return {
      platos,
      vapor,
      cil: new THREE.CylinderGeometry(1, 0.8, 1, 18),
      loza: mat({ color: "#ffffff", roughness: 0.4 }),
      madera: mat({ color: "#5a4030", roughness: 0.6 }),
      olla: mat({ color: "#8a8f96", metalness: 0.8, roughness: 0.3 }),
      foco: new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false }),
      humo: new THREE.SpriteMaterial({ map: texturaHumo(), color: "#fff4e6", transparent: true, opacity: 0.35, depthWrite: false }),
      cable: new THREE.MeshBasicMaterial({ color: "#151515" }),
    };
  }, [largo]);
  const t = frame / 30;
  return (
    <group>
      <mesh position={[0, 0.74, 0]} material={r.madera} castShadow receiveShadow><boxGeometry args={[largo, 0.08, 1.2]} /></mesh>
      {[-largo / 2 + 0.3, largo / 2 - 0.3].map((x) => [-0.5, 0.5].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.37, z]} material={r.madera}><boxGeometry args={[0.08, 0.74, 0.08]} /></mesh>
      )))}
      <Instancias items={r.platos} geometria={r.cil} material={r.loza} />
      {[-largo / 2 - 1.2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.45, 0]} material={r.madera}><boxGeometry args={[1.2, 0.9, 1]} /></mesh>
          <mesh position={[0, 1.15, 0]} material={r.olla} castShadow><cylinderGeometry args={[0.38, 0.34, 0.5, 24]} /></mesh>
        </group>
      ))}
      {r.vapor.map((v, i) => {
        const u = (t * 0.25 * v.v + v.o) % 1;
        return (
          <sprite key={i} position={[v.x + Math.sin(t + i) * 0.05, 0.85 + u * 1.1, v.z]} material={r.humo} scale={(0.12 + u * 0.4) * (1 - u * 0.3)} />
        );
      })}
      {Array.from({ length: Math.floor(largo / 2) + 1 }, (_, i) => -largo / 2 + i * 2).map((x) => (
        <group key={x} position={[x, 3.1, 0]}>
          <mesh position={[0, 0.5, 0]} material={r.cable}><cylinderGeometry args={[0.008, 0.008, 1, 4]} /></mesh>
          <mesh material={r.foco}><sphereGeometry args={[0.07, 12, 8]} /></mesh>
          <pointLight intensity={4.5} distance={4.5} decay={1.8} color="#ffcf8f" />
        </group>
      ))}
    </group>
  );
}

/** Muro que se va pintando: una franja roja que avanza (`pinta` 0..1). */
export function Mural({ pinta }: { pinta: number }) {
  const r = useMemo(() => ({ muro: mat({ color: "#3a3632", roughness: 0.9 }), pintura: mat({ color: ROJO, roughness: 0.6 }), crema: mat({ color: CREMA, roughness: 0.7 }) }), []);
  const w = 10 * clamp01(pinta);
  return (
    <group position={[0, 0, -2]}>
      <mesh position={[0, 2.2, 0]} material={r.muro} receiveShadow><boxGeometry args={[12, 4.4, 0.3]} /></mesh>
      {w > 0.01 ? (
        <>
          <mesh position={[-5 + w / 2, 2.6, 0.16]} material={r.pintura}><boxGeometry args={[w, 1.2, 0.02]} /></mesh>
          <mesh position={[-5 + (w * 0.7) / 2, 1.6, 0.16]} material={r.crema}><boxGeometry args={[w * 0.7, 0.35, 0.02]} /></mesh>
        </>
      ) : null}
    </group>
  );
}

/** Pista de carrera con andariveles rojos. */
export function Pista({ andariveles = 7 }: { andariveles?: number }) {
  const r = useMemo(() => ({ linea: new THREE.MeshBasicMaterial({ color: "#a01224", toneMapped: false }) }), []);
  return (
    <group>
      {Array.from({ length: andariveles + 1 }, (_, i) => (i - andariveles / 2) * 1.4).map((x) => (
        <mesh key={x} position={[x, 0.01, -20]} rotation={[-Math.PI / 2, 0, 0]} material={r.linea}>
          <planeGeometry args={[0.06, 80]} />
        </mesh>
      ))}
    </group>
  );
}

/** Viga que levantan entre muchos (`alto` en metros). */
export function Viga({ alto }: { alto: number }) {
  return (
    <mesh position={[0, alto, 0]} castShadow>
      <boxGeometry args={[14, 0.35, 0.35]} />
      <meshStandardMaterial color="#c9bfae" roughness={0.6} />
    </mesh>
  );
}
