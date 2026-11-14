import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { clamp01, crearAzar, easeInOutCubic, easeOutBack, lerp, progreso, type ClaveCamara, type Vec3 } from "../../../lib/anim";
import { Escenario, type EstadoEscenario } from "../../../three/Escenario";
import { Escuela, Hospital, POS_ESCUELA, POS_HOSPITAL } from "../../../three/Edificios";
import { CASA_QUIETA } from "../../../three/Casa";
import { datosCiudad } from "../../../three/Ciudad";
import { CierreFinal, TituloEscena } from "../../../ui/Superposiciones";
import { CONEXIONES, FPS, Lienzo, OPCIONES, RED_LLENA, TIEMPOS, s } from "../comun";
import { CAMARA_E5 } from "./Escena5";

/**
 * Escena 6 — El agua no se vende (15,5 s)
 * La red se ilumina, líneas de luz conectan los edificios, las corrientes
 * convergen en una gran gota; el fondo se oscurece y aparece el cierre.
 */

const ultima = CAMARA_E5[CAMARA_E5.length - 1];
const GOTA: Vec3 = [0, 64, -4];

export const CAMARA_E6: ClaveCamara[] = [
  { f: 0, pos: ultima.pos, target: ultima.target, fov: ultima.fov },
  { f: s(3.0), pos: [-18, 40, 66], target: [0, 4, 0], fov: 42 },
  { f: s(6.0), pos: [-34, 92, 118], target: [0, 22, -4], fov: 42 },
  { f: s(9.0), pos: [-16, 76, 58], target: [0, 64, -4], fov: 40 },
  { f: s(11.6), pos: [-6, 72, 34], target: [0, 68, -4], fov: 40 },
  { f: s(15.5), pos: [-4, 71.5, 29], target: [0, 68, -4], fov: 40 },
];

export function estadoE6(frame: number): EstadoEscenario {
  const luz = progreso(frame, s(0.3), s(4.0), easeInOutCubic);
  return {
    camara: CAMARA_E6,
    casa: CASA_QUIETA,
    rayosX: 1,
    oscuridad: lerp(0, 0.65, progreso(frame, s(1.5), s(6))) + 0.3 * progreso(frame, s(9), s(12)),
    red: { frente: RED_LLENA, brillo: lerp(1.3, 3.4, luz), vidrio: lerp(0.3, 0.55, luz) },
  };
}

function perfilGota() {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = -Math.PI / 2 + (i / 24) * (Math.PI / 2 + 0.55);
    pts.push(new THREE.Vector2(Math.cos(a), Math.sin(a)));
  }
  pts.push(new THREE.Vector2(0.001, 2.25));
  return new THREE.LatheGeometry(pts, 64);
}

export interface TiemposGota {
  arcos: number;
  particulas: number;
  ventana: number;
  gota: readonly [number, number];
}
const TIEMPOS_GOTA_E6: TiemposGota = { arcos: s(2.0), particulas: s(6.4), ventana: s(4.0), gota: [s(7.2), s(10.2)] };

export function LucesYGota({ frame, tiempos = TIEMPOS_GOTA_E6 }: { frame: number; tiempos?: TiemposGota }) {
  const r = useMemo(() => {
    const azar = crearAzar(404);
    const casa: Vec3 = [0, 6, 0];
    const hosp: Vec3 = [POS_HOSPITAL[0], 13, POS_HOSPITAL[2]];
    const esc: Vec3 = [POS_ESCUELA[0], 8, POS_ESCUELA[2]];
    const lotes = datosCiudad(OPCIONES).lotes.filter((l) => Math.hypot(l.x, l.z) < 80);
    const destinos: Vec3[] = Array.from({ length: 22 }, () => {
      const l = lotes[Math.floor(azar.n() * lotes.length)];
      return [l.x, l.tipo === "torre" ? 20 : 5, l.z] as Vec3;
    });
    const pares: [Vec3, Vec3][] = [
      [casa, hosp],
      [casa, esc],
      [esc, hosp],
      ...destinos.map((d, i) => [[casa, hosp, esc][i % 3], d] as [Vec3, Vec3]),
    ];
    const arcos = pares.map(([a, b]) => {
      const medio = new THREE.Vector3((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 8 + Math.hypot(a[0] - b[0], a[2] - b[2]) * 0.25, (a[2] + b[2]) / 2);
      const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), medio, new THREE.Vector3(...b));
      return new THREE.TubeGeometry(curva, 48, 0.24, 6, false);
    });
    const particulas = Array.from({ length: 150 }, () => {
      const l = lotes[Math.floor(azar.n() * lotes.length)];
      const o = new THREE.Vector3(l.calle[0], 0.4, l.calle[1]);
      const c = new THREE.Vector3(o.x * 0.4, 30 + azar.entre(0, 25), o.z * 0.4);
      return { curva: new THREE.QuadraticBezierCurve3(o, c, new THREE.Vector3(...GOTA)), demora: azar.entre(0, 1), dur: azar.entre(0.5, 0.9) };
    });
    return {
      arcos,
      particulas,
      geoGota: perfilGota(),
      luz: new THREE.MeshBasicMaterial({ color: "#36c2ff", toneMapped: false, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
      chispa: new THREE.MeshBasicMaterial({ color: "#bff0ff", toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      gota: new THREE.MeshStandardMaterial({ color: "#58c6ff", roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.88, emissive: "#1aa3ff", emissiveIntensity: 0.9, envMapIntensity: 2.5 }),
      nucleo: new THREE.MeshBasicMaterial({ color: "#c9f3ff", toneMapped: false, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
      halo: new THREE.MeshBasicMaterial({ color: "#4fc3ff", toneMapped: false, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }),
    };
  }, []);

  // Líneas de luz que crecen entre edificios.
  r.arcos.forEach((g, i) => {
    const p = progreso(frame, tiempos.arcos + i * 2.2, tiempos.arcos + s(1.4) + i * 2.2, easeInOutCubic);
    const total = g.index ? g.index.count : 0;
    const paso = 6 * 6;
    g.setDrawRange(0, Math.floor((total * p) / paso) * paso);
  });

  const forma = easeOutBack(progreso(frame, tiempos.gota[0], tiempos.gota[1]));
  const pulso = 1 + Math.sin(frame * 0.12) * 0.02;
  const t0 = tiempos.particulas;
  const ventana = tiempos.ventana;

  return (
    <group>
      {r.arcos.map((g, i) => (
        <mesh key={i} geometry={g} material={r.luz} />
      ))}
      {r.particulas.map((p, i) => {
        const inicio = t0 + p.demora * ventana * 0.6;
        const u = clamp01((frame - inicio) / (p.dur * ventana));
        if (u <= 0 || u >= 1) return null;
        const pos = p.curva.getPoint(easeInOutCubic(u));
        return (
          <mesh key={i} position={pos} material={r.chispa} scale={0.5 + (1 - u) * 0.4}>
            <sphereGeometry args={[0.5, 8, 6]} />
          </mesh>
        );
      })}
      {forma > 0.001 ? (
        <group position={GOTA} scale={7 * forma * pulso} rotation={[0, frame * 0.01, 0]}>
          <mesh geometry={r.geoGota} material={r.gota} />
          <mesh material={r.nucleo} position={[0, 0.1, 0]} scale={0.55}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          <mesh material={r.halo} scale={1.35}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          <pointLight color="#6fd6ff" intensity={60} distance={40} decay={1.4} />
        </group>
      ) : null}
    </group>
  );
}

export const Escena6: React.FC = () => {
  const frame = useCurrentFrame();
  const estado = estadoE6(frame);
  const e6 = TIEMPOS.escenas[5];
  const cierre = e6.cierre ? s(e6.cierre.inicio - e6.inicio) : s(12);
  const oscuro = progreso(frame, s(10.2), s(12.0), easeInOutCubic);
  return (
    <AbsoluteFill>
      <Lienzo>
        <Escenario frame={frame} fps={FPS} estado={estado} opciones={OPCIONES} conexiones={CONEXIONES}>
          {() => (
            <>
              <Hospital />
              <Escuela frame={frame} />
              <LucesYGota frame={frame} />
            </>
          )}
        </Escenario>
      </Lienzo>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: oscuro,
          background: "radial-gradient(ellipse 60% 34% at 50% 66%, rgba(6,16,28,0.15) 0%, rgba(6,16,28,0.88) 70%, rgba(6,16,28,0.97) 100%)",
        }}
      />
      <TituloEscena frame={frame - s(0.4)} fps={FPS} numero={6} titulo="EL AGUA NO SE VENDE" dura={2.6} />
      <CierreFinal frame={frame - cierre} fps={FPS} texto={e6.cierre?.texto ?? ""} />
    </AbsoluteFill>
  );
};
