import { useMemo } from "react";
import * as THREE from "three";
import { crearAzar, easeOutBack, progreso, type Vec3 } from "../lib/anim";
import { BACHA, CANO_MAESTRO, SUELO_TECHO, T } from "../demo/escena";
import { texturaManometro, texturaSuelo } from "./texturas";
import { Instancias, type Instancia } from "./Instancias";

/**
 * Corte del subsuelo: red de agua (caños translúcidos para ver que están
 * vacíos), conexiones domiciliarias, manómetro, y otras redes de servicio
 * (cloaca, gas, fibra) para dar escala y contexto.
 */

const X_CONEXIONES = [-8.05, BACHA[0], 8.05];
const Y_CONEXION = -1.5;
/** Manómetro sobre la conexión de la casa protagonista. */
const MANOMETRO: Vec3 = [BACHA[0], Y_CONEXION + 0.5, 1.2];

type Tramo = { a: Vec3; b: Vec3; r: number };

/** Recorrido de cada conexión: del caño maestro hasta subir a la casa. */
function recorridoConexion(x: number, zCasa: number): Vec3[] {
  return [
    [x, CANO_MAESTRO.y, CANO_MAESTRO.z],
    [x, Y_CONEXION, CANO_MAESTRO.z],
    [x, Y_CONEXION, zCasa],
    [x, SUELO_TECHO + 0.02, zCasa],
  ];
}

function Tubo({ tramo, material, lados = 20 }: { tramo: Tramo; material: THREE.Material; lados?: number }) {
  const a = new THREE.Vector3(...tramo.a);
  const b = new THREE.Vector3(...tramo.b);
  const largo = a.distanceTo(b);
  const medio = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <mesh position={medio} quaternion={q} material={material}>
      <cylinderGeometry args={[tramo.r, tramo.r, largo, lados, 1, true]} />
    </mesh>
  );
}

export function Subsuelo({
  frame,
  oculto,
  sinRed = false,
  manometro = T.manometro,
  finPulsos = T.bajoTierra[1],
}: {
  frame: number;
  oculto: boolean;
  /** Sin caños propios: la red completa la dibuja RedAgua. */
  sinRed?: boolean;
  manometro?: readonly [number, number];
  finPulsos?: number;
}) {
  const m = useMemo(() => {
    const suelo = texturaSuelo();
    suelo.repeat.set(6, 1);
    return {
      tierra: new THREE.MeshStandardMaterial({ map: suelo, roughness: 1, side: THREE.BackSide }),
      vidrio: new THREE.MeshStandardMaterial({
        color: "#a8e2ff", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.34,
        side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2.5,
      }),
      vidrioInterior: new THREE.MeshStandardMaterial({
        color: "#0e2433", roughness: 1, transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false,
      }),
      brida: new THREE.MeshStandardMaterial({ color: "#2c6fb0", roughness: 0.35, metalness: 0.5 }),
      sedimento: new THREE.MeshStandardMaterial({ color: "#8a7a63", roughness: 1 }),
      cloaca: new THREE.MeshStandardMaterial({ color: "#8e8a82", roughness: 0.95 }),
      gas: new THREE.MeshStandardMaterial({ color: "#f2c230", roughness: 0.5 }),
      fibra: new THREE.MeshStandardMaterial({ color: "#ff7a2f", roughness: 0.5 }),
      valvula: new THREE.MeshStandardMaterial({ color: "#d33b2c", roughness: 0.4, metalness: 0.3 }),
      metal: new THREE.MeshStandardMaterial({ color: "#9aa4ad", roughness: 0.3, metalness: 0.9 }),
      dial: new THREE.MeshBasicMaterial({ map: texturaManometro(), toneMapped: false }),
      aguja: new THREE.MeshBasicMaterial({ color: "#d11f1f" }),
      pulso: new THREE.MeshBasicMaterial({ color: "#7fd8ff", transparent: true, opacity: 1, depthWrite: false, toneMapped: false }),
      raiz: new THREE.MeshStandardMaterial({ color: "#6b4a32", roughness: 1 }),
      piedra: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, flatShading: true }),
      polvo: new THREE.MeshBasicMaterial({ color: "#ffd9a8", transparent: true, opacity: 0.5, depthWrite: false }),
    };
  }, []);

  const geo = useMemo(() => {
    const azar = crearAzar(99);
    const raices = [-13, -7.5, 7, 11.5].map((x, i) => {
      const z = azar.entre(5, 10);
      const puntos = Array.from({ length: 5 }, (_, k) =>
        new THREE.Vector3(x + azar.entre(-0.4, 0.4), SUELO_TECHO - k * azar.entre(0.15, 0.3), z + azar.entre(-0.4, 0.4)),
      );
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 16, 0.035 - i * 0.003, 6, false);
    });
    const piedras: Instancia[] = Array.from({ length: 70 }, () => ({
      p: [azar.entre(-26, 30), azar.entre(-5.8, -2.8), azar.entre(-16, 24)] as Vec3,
      s: Array(3).fill(azar.entre(0.15, 0.6)) as Vec3,
      r: [azar.entre(0, 3), azar.entre(0, 3), azar.entre(0, 3)] as Vec3,
      c: azar.elegir(["#8d7a66", "#a08c76", "#6f604f", "#b3a28c"]),
    }));
    const polvo = Array.from({ length: 70 }, () => ({
      base: [azar.entre(-11, 5), azar.entre(-2.6, -0.4), azar.entre(-4, 9)] as Vec3,
      fase: azar.entre(0, 6.28),
    }));
    return { raices, piedras, roca: new THREE.DodecahedronGeometry(1, 0), polvo };
  }, []);

  const conexiones = X_CONEXIONES.map((x) => recorridoConexion(x, x === BACHA[0] ? BACHA[2] + 0.35 : -2));

  // Pulsos de agua que se frenan y se apagan: el agua deja de circular.
  const t0 = 150;
  const tau = 16;
  const avance = (f: number) => (f < t0 ? 0 : 0.22 * tau * (1 - Math.exp(-(f - t0) / tau)));
  const apagado = 1 - progreso(frame, finPulsos, finPulsos + 30);
  m.pulso.opacity = apagado;

  // Manómetro: la aguja cae a cero y rebota contra el tope.
  const caida = progreso(frame, manometro[0], manometro[1], easeOutBack);
  const valor = 0.62 * (1 - caida);
  const anguloAguja = -(Math.PI * 0.75 + Math.max(-0.03, valor) * Math.PI * 1.5);
  const aCamara = Math.atan2(-2.8 - MANOMETRO[0], -1.6 - MANOMETRO[2]);

  return (
    <group visible={!oculto}>
      {/* Volumen de tierra (se ve desde adentro) */}
      <mesh position={[2, (SUELO_TECHO - 6) / 2, 4]} material={m.tierra}>
        <boxGeometry args={[60, SUELO_TECHO + 6, 44]} />
      </mesh>

      {/* Caño maestro bajo la calle */}
      <group visible={!sinRed}>
        <Tubo tramo={{ a: [-28, CANO_MAESTRO.y, CANO_MAESTRO.z], b: [32, CANO_MAESTRO.y, CANO_MAESTRO.z], r: CANO_MAESTRO.radio }} material={m.vidrio} lados={36} />
        <Tubo tramo={{ a: [-28, CANO_MAESTRO.y, CANO_MAESTRO.z], b: [32, CANO_MAESTRO.y, CANO_MAESTRO.z], r: CANO_MAESTRO.radio - 0.02 }} material={m.vidrioInterior} lados={36} />
        <mesh position={[2, CANO_MAESTRO.y - CANO_MAESTRO.radio + 0.06, CANO_MAESTRO.z]} material={m.sedimento}>
          <boxGeometry args={[60, 0.03, 0.42]} />
        </mesh>
        {Array.from({ length: 13 }, (_, i) => -26 + i * 4.8).map((x) => (
          <mesh key={x} position={[x, CANO_MAESTRO.y, CANO_MAESTRO.z]} rotation={[0, 0, Math.PI / 2]} material={m.brida}>
            <cylinderGeometry args={[CANO_MAESTRO.radio + 0.07, CANO_MAESTRO.radio + 0.07, 0.16, 32]} />
          </mesh>
        ))}
      </group>

      {/* Conexiones domiciliarias */}
      {conexiones.map((pts, i) => (
        <group key={i} visible={!sinRed}>
          {pts.slice(1).map((b, k) => (
            <group key={k}>
              <Tubo tramo={{ a: pts[k], b, r: 0.13 }} material={m.vidrio} />
              <mesh position={b} material={m.brida}>
                <sphereGeometry args={[0.17, 20, 14]} />
              </mesh>
            </group>
          ))}
          <mesh position={[pts[0][0], CANO_MAESTRO.y + CANO_MAESTRO.radio - 0.05, pts[0][2]]} material={m.brida}>
            <cylinderGeometry args={[0.2, 0.2, 0.18, 20]} />
          </mesh>
        </group>
      ))}

      {/* Llave de paso y manómetro sobre la conexión protagonista */}
      <group position={[BACHA[0], Y_CONEXION, 6]}>
        <mesh material={m.valvula}>
          <sphereGeometry args={[0.24, 20, 14]} />
        </mesh>
        <mesh material={m.metal} position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.4, 12]} />
        </mesh>
        <mesh material={m.valvula} position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.03, 10, 28]} />
        </mesh>
      </group>
      <group position={MANOMETRO} rotation={[0, aCamara, 0]}>
        <mesh material={m.metal} position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
        </mesh>
        <mesh material={m.metal} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.1, 40]} />
        </mesh>
        <mesh material={m.dial} position={[0, 0, 0.052]}>
          <circleGeometry args={[0.32, 48]} />
        </mesh>
        <group position={[0, 0, 0.06]} rotation={[0, 0, anguloAguja]}>
          <mesh material={m.aguja}>
            <circleGeometry args={[0.03, 20]} />
          </mesh>
          <mesh material={m.aguja} position={[0.12, 0, 0.002]}>
            <boxGeometry args={[0.24, 0.018, 0.006]} />
          </mesh>
        </group>
      </group>

      {/* Pulsos de agua (se frenan y desaparecen) */}
      {apagado > 0.01 && !sinRed ? (
        <group>
          {Array.from({ length: 12 }, (_, i) => {
            const x = ((-20 + i * 4.4 + avance(frame) * 2.2 + 48) % 48) - 20;
            return (
              <mesh key={`m${i}`} position={[x, CANO_MAESTRO.y, CANO_MAESTRO.z]} rotation={[0, 0, Math.PI / 2]} material={m.pulso}>
                <capsuleGeometry args={[0.1, 1.0, 4, 12]} />
              </mesh>
            );
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const z = CANO_MAESTRO.z - ((i * 2.4 + avance(frame) * 1.4) % (CANO_MAESTRO.z - BACHA[2]));
            return (
              <mesh key={`c${i}`} position={[BACHA[0], Y_CONEXION, z]} rotation={[Math.PI / 2, 0, 0]} material={m.pulso}>
                <capsuleGeometry args={[0.045, 0.45, 4, 10]} />
              </mesh>
            );
          })}
        </group>
      ) : null}

      {/* Otras redes */}
      <Tubo tramo={{ a: [-28, -4.2, 13], b: [32, -4.2, 13], r: 0.62 }} material={m.cloaca} lados={28} />
      <Tubo tramo={{ a: [-28, -1.25, 16.3], b: [32, -1.25, 16.3], r: 0.1 }} material={m.gas} />
      <Tubo tramo={{ a: [-28, -0.75, 10.2], b: [32, -0.75, 10.2], r: 0.07 }} material={m.fibra} />

      {/* Raíces, piedras y polvo en suspensión */}
      {geo.raices.map((g, i) => (
        <mesh key={i} geometry={g} material={m.raiz} />
      ))}
      <Instancias items={geo.piedras} geometria={geo.roca} material={m.piedra} sombra={false} recibe={false} />
      {geo.polvo.map((p, i) => (
        <mesh
          key={i}
          material={m.polvo}
          position={[
            p.base[0] + Math.sin(frame * 0.02 + p.fase) * 0.3,
            p.base[1] + Math.sin(frame * 0.03 + p.fase * 2) * 0.15,
            p.base[2] + Math.cos(frame * 0.017 + p.fase) * 0.3,
          ]}
        >
          <sphereGeometry args={[0.014, 6, 4]} />
        </mesh>
      ))}

      {/* Luces del subsuelo */}
      <pointLight position={[1, -1.0, 5]} color="#6fb7ff" intensity={40} distance={18} decay={1.6} />
      <pointLight position={[-6, -0.5, -1]} color="#ffb36b" intensity={24} distance={14} decay={1.6} />
      <pointLight position={[6, -1.6, 12]} color="#5aa0ff" intensity={20} distance={16} decay={1.6} />
      <pointLight position={[MANOMETRO[0] - 1.2, MANOMETRO[1] + 0.6, MANOMETRO[2] - 1.2]} color="#ffffff" intensity={2.5} distance={4} decay={2} />
    </group>
  );
}
