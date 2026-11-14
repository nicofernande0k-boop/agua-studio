import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { crearAzar, easeInOutCubic, lerp, progreso, type ClaveCamara } from "../../../lib/anim";
import { Escenario, type EstadoEscenario } from "../../../three/Escenario";
import { Escuela, Hospital, Planta } from "../../../three/Edificios";
import { CASA_QUIETA } from "../../../three/Casa";
import { Trabajador, type Pose } from "../../../three/Personaje";
import { PLANTA } from "../../../three/RedAgua";
import { texturaSuelo, texturaTexto } from "../../../three/texturas";
import { Fundido, TituloEscena } from "../../../ui/Superposiciones";
import { CONEXIONES, FPS, Lienzo, OPCIONES, RED_LLENA, brilloPorAgua, s } from "../comun";

/**
 * Escena 5 — Los que hacen posible el agua (13 s)
 * Red vacía → planta potabilizadora: un operador abre la válvula →
 * cuadrilla reparando un caño en una zanja → el agua recorre kilómetros de
 * cañerías y llega a las casas, que recuperan sus colores.
 */

const ZANJA = { x: -100, z: 13 };
const X_PLANTA = PLANTA.x - 12;

export const CAMARA_E5: ClaveCamara[] = [
  { f: 0, pos: [-60, 150, 120], target: [-110, 0, 13], fov: 40 },
  { f: s(2.0), pos: [-80, 46, 66], target: [-118, 0, 13], fov: 40 },
  { f: s(4.2), pos: [-130, 17, 40], target: [-160, 2, 10], fov: 42 },
  { f: s(5.6), pos: [-155, 5.2, 6.5], target: [-161, 1.7, 13.4], fov: 42 },
  { f: s(6.7), pos: [-116, 8, 12], target: [-100, -2.5, 13], fov: 42 },
  { f: s(8.2), pos: [-98.2, 5.4, 9.6], target: [-100, -2.9, 13.7], fov: 44 },
  { f: s(9.4), pos: [-80, 26, 18], target: [-55, -1, 13], fov: 42 },
  { f: s(11.2), pos: [-30, 26, 30], target: [-5, -1, 10], fov: 42 },
  { f: s(13.0), pos: [-2, 10, 15.5], target: [2, -1.5, 4], fov: 44 },
];

export function frenteE5(f: number) {
  if (f < s(6.5)) return lerp(0, 40, progreso(f, s(4.8), s(6.4), easeInOutCubic));
  return lerp(40, RED_LLENA, progreso(f, s(7.9), s(12.8), (t) => t * (0.7 + 0.3 * t)));
}

export function estadoE5(frame: number): EstadoEscenario {
  const frente = frenteE5(frame);
  return {
    camara: CAMARA_E5,
    casa: CASA_QUIETA,
    rayosX: 1,
    oscuridad: 0.55 * (1 - progreso(frente, 40, RED_LLENA * 0.8)),
    brillo: brilloPorAgua(frente),
    red: { frente, brillo: 1.3 },
  };
}

/** Zanja con la cuadrilla reparando el caño maestro. */
function Zanja({ frame }: { frame: number }) {
  const r = useMemo(() => {
    const t = texturaSuelo();
    t.repeat.set(2, 1);
    const azar = crearAzar(77);
    return {
      tierra: new THREE.MeshStandardMaterial({ map: t, side: THREE.BackSide, roughness: 1 }),
      valla: new THREE.MeshStandardMaterial({ color: "#ff7a1a", roughness: 0.6 }),
      blanco: new THREE.MeshStandardMaterial({ color: "#f4f4f2", roughness: 0.6 }),
      cono: new THREE.MeshStandardMaterial({ color: "#ff6a1a", roughness: 0.5 }),
      azul: new THREE.MeshStandardMaterial({ color: "#2c6fb0", roughness: 0.35, metalness: 0.5 }),
      metal: new THREE.MeshStandardMaterial({ color: "#b8c0c8", roughness: 0.25, metalness: 0.9 }),
      gota: new THREE.MeshBasicMaterial({ color: "#8fe0ff", transparent: true, opacity: 0.85, toneMapped: false }),
      cartel: new THREE.MeshBasicMaterial({ map: texturaTexto("SERVICIO DE AGUA", { fondo: "#1f6fb2", color: "#ffffff", ancho: 1024, alto: 128, tamano: 70 }), toneMapped: false }),
      gotas: Array.from({ length: 18 }, () => ({ a: azar.entre(-1, 1), v: azar.entre(0.6, 1.2), fase: azar.entre(0, 1) })),
    };
  }, []);
  const t = frame / FPS;
  const cierre = easeInOutCubic(progreso(frame, s(6.6), s(7.6)));
  const trabajando = frame > s(6.4) && frame < s(7.9);
  const fuga = frame > s(6.2) && frame < s(7.7) ? 1 : 0;
  const giroLlave = trabajando ? Math.sin(t * 9) * 0.35 : 0;
  const poseLlave: Pose = { hombroD: [1.25 + giroLlave * 0.4, 0.15], codoD: 0.5 + giroLlave, hombroI: [0.9, 0.2], codoI: 0.7, torso: 0.28, cabeza: [0, 0.25] };
  const poseLinterna: Pose = { caderaD: 1.5, caderaI: 0.2, rodillaD: 1.7, rodillaI: 1.9, bajar: 0.38, hombroD: [1.1, -0.1], codoD: 0.3, hombroI: [0.4, 0.1], codoI: 0.6, torso: 0.2, cabeza: [0.3, 0.2] };
  const palear = Math.sin(t * 4);
  const posePala: Pose = { hombroD: [0.9 + palear * 0.3, 0.1], codoD: 0.8, hombroI: [0.7 + palear * 0.3, 0.1], codoI: 0.9, torso: 0.35 + palear * 0.08, cabeza: [0, 0.3] };

  return (
    <group>
      {/* Excavación (se ve gracias al suelo transparente) */}
      <mesh position={[ZANJA.x, -1.85, ZANJA.z]} material={r.tierra}>
        <boxGeometry args={[10, 3.7, 6.4]} />
      </mesh>
      {/* Abrazadera de reparación que se cierra sobre el caño */}
      <group position={[ZANJA.x, -2.4, ZANJA.z]} rotation={[0, 0, Math.PI / 2]}>
        {[0, 1].map((k) => (
          <mesh key={k} material={r.azul} rotation={[0, k * Math.PI + (k ? -1 : 1) * (1 - cierre) * 1.2, 0]}>
            <cylinderGeometry args={[0.66, 0.66, 0.9, 24, 1, true, 0, Math.PI]} />
          </mesh>
        ))}
        {[-0.3, 0.3].map((y) => (
          <mesh key={y} material={r.metal} position={[0.72, y, 0]} visible={cierre > 0.95}>
            <boxGeometry args={[0.16, 0.12, 0.3]} />
          </mesh>
        ))}
      </group>
      {/* Fuga antes de la reparación */}
      {fuga
        ? r.gotas.map((g, i) => {
            const u = ((t * g.v + g.fase) % 0.5) / 0.5;
            return (
              <mesh key={i} material={r.gota} position={[ZANJA.x + g.a * 0.25, -1.85 + u * 0.9 - u * u * 1.4, ZANJA.z + 0.5 + u * 0.8]}>
                <sphereGeometry args={[0.04, 8, 6]} />
              </mesh>
            );
          })
        : null}
      <Trabajador position={[ZANJA.x - 0.6, -3.7, ZANJA.z + 1.05]} rotacion={Math.PI} pose={poseLlave} herramienta="llave" piel={0} casco="#f7f7f2" />
      <Trabajador position={[ZANJA.x + 1.4, -3.7, ZANJA.z + 1.1]} rotacion={Math.PI + 0.35} pose={poseLinterna} herramienta="linterna" piel={1} casco="#f2c230" />
      <Trabajador position={[ZANJA.x + 3.2, 0.15, ZANJA.z + 4.0]} rotacion={Math.PI - 0.5} pose={posePala} herramienta="pala" piel={2} casco="#f7f7f2" />
      <pointLight position={[ZANJA.x, -1.6, ZANJA.z + 1.8]} color="#ffd59a" intensity={7} distance={9} decay={1.6} />
      {/* Vallas, conos y camión de servicio en la calle */}
      {[
        [0, -3.6, 10.6, 0],
        [0, 3.6, 10.6, 0],
        [-5.6, 0, 7.6, Math.PI / 2],
        [5.6, 0, 7.6, Math.PI / 2],
      ].map(([, dz, w, ry], i) => (
        <group key={i} position={[ZANJA.x + (i === 2 ? -5.6 : i === 3 ? 5.6 : 0), 0.15, ZANJA.z + (i < 2 ? dz : 0)]} rotation={[0, ry, 0]}>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} material={k % 2 ? r.blanco : r.valla} position={[-w / 2 + (k + 0.5) * (w / 4), 0.8, 0]}>
              <boxGeometry args={[w / 4, 0.28, 0.08]} />
            </mesh>
          ))}
          {[-w / 2, w / 2].map((x) => (
            <mesh key={x} material={r.blanco} position={[x, 0.45, 0]}>
              <boxGeometry args={[0.08, 0.9, 0.08]} />
            </mesh>
          ))}
        </group>
      ))}
      {[[-7.2, 9.8], [-7.2, 16.2], [7.2, 9.8], [7.2, 16.2]].map(([dx, z], i) => (
        <mesh key={i} material={r.cono} position={[ZANJA.x + dx, 0.5, z]}>
          <coneGeometry args={[0.28, 0.75, 16]} />
        </mesh>
      ))}
      <group position={[ZANJA.x - 12, 0, ZANJA.z - 2.3]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={r.blanco} position={[0, 1.6, -1.2]} castShadow>
          <boxGeometry args={[2.4, 2.4, 4.4]} />
        </mesh>
        <mesh material={r.azul} position={[0, 1.3, 2.4]} castShadow>
          <boxGeometry args={[2.3, 2.0, 2.0]} />
        </mesh>
        <mesh material={r.cartel} position={[1.22, 2.0, -1.2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.0, 0.5]} />
        </mesh>
        <mesh material={r.valla} position={[0, 3.0, 1.9]}>
          <boxGeometry args={[1.2, 0.2, 0.3]} />
        </mesh>
      </group>
    </group>
  );
}

/** Operador abriendo la válvula de salida en la planta. */
function Operador({ frame }: { frame: number }) {
  const r = useMemo(() => ({ rojo: new THREE.MeshStandardMaterial({ color: "#d33b2c", roughness: 0.35 }) }), []);
  const giro = easeInOutCubic(progreso(frame, s(5.0), s(6.2))) * Math.PI * 2;
  const mano = Math.sin(giro) * 0.15;
  const pose: Pose = { hombroD: [1.35 + mano, 0.15], hombroI: [1.35 - mano, 0.15], codoD: 0.25, codoI: 0.25, cabeza: [0, 0.1] };
  const base: [number, number, number] = [X_PLANTA + 9, 0, PLANTA.z];
  return (
    <group>
      <mesh position={[base[0], 1.95, base[2]]} material={r.rojo}>
        <cylinderGeometry args={[0.07, 0.07, 0.35, 10]} />
      </mesh>
      <group position={[base[0], 2.12, base[2]]} rotation={[0, giro, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={r.rojo}>
          <torusGeometry args={[0.6, 0.055, 10, 32]} />
        </mesh>
        <mesh material={r.rojo}>
          <boxGeometry args={[1.2, 0.05, 0.05]} />
        </mesh>
        <mesh material={r.rojo} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.2, 0.05, 0.05]} />
        </mesh>
      </group>
      <Trabajador position={[base[0], 0.24, base[2] + 1.3]} rotacion={Math.PI} pose={pose} piel={3} casco="#f7f7f2" />
      <Trabajador position={[base[0] - 2.6, 0.24, base[2] + 2.2]} rotacion={2.6} pose={{ hombroD: [0.9, 0], codoD: 1.1, cabeza: [0.4, 0.3] }} herramienta="tablet" piel={4} casco="#f2c230" />
    </group>
  );
}

export const Escena5: React.FC = () => {
  const frame = useCurrentFrame();
  const estado = estadoE5(frame);
  const entrada = 1 - progreso(frame, 0, s(0.7));
  return (
    <AbsoluteFill>
      <Lienzo>
        <Escenario frame={frame} fps={FPS} estado={estado} opciones={OPCIONES} conexiones={CONEXIONES}>
          {() => (
            <>
              <Hospital brillo={Math.min(1, 0.2 + frenteE5(frame) / RED_LLENA)} />
              <Escuela frame={frame} brillo={Math.min(1, 0.2 + frenteE5(frame) / (RED_LLENA * 0.6))} />
              <Planta frame={frame} x={X_PLANTA} z={PLANTA.z} actividad={progreso(frame, s(5.0), s(6.2))} />
              <Operador frame={frame} />
              <Zanja frame={frame} />
            </>
          )}
        </Escenario>
      </Lienzo>
      <Fundido color="#eef5fa" opacidad={entrada} />
      <TituloEscena frame={frame - s(0.6)} fps={FPS} numero={5} titulo="LOS QUE HACEN POSIBLE EL AGUA" dura={2.8} />
    </AbsoluteFill>
  );
};
