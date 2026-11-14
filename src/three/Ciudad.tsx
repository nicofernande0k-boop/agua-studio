import { useMemo } from "react";
import * as THREE from "three";
import { crearAzar, type Vec3 } from "../lib/anim";
import { Instancias, escribirInstancias, type Instancia } from "./Instancias";
import { CALLE_Z } from "../demo/escena";

/**
 * Ciudad argentina en miniatura generada por código: manzanas de 26 m con
 * veredas, casas con tejas o azotea con tanque de agua, PH, torres hacia el
 * "centro", árboles (con jacarandás y lapachos), fondos con pileta, autos y
 * colectivos que circulan. Todo con semilla fija: siempre sale igual.
 */

export const PASO = 33; // manzana (26) + calle (7)
const MEDIA = 13; // media manzana
const LINEA = 11.5; // línea municipal (después de la vereda de 1,5 m)
export const NIVEL_VEREDA = 0.15;
const N = 3; // manzanas a cada lado de la protagonista

const PARED = ["#f2e3c6", "#e9c9a8", "#f6efe4", "#d8e4dc", "#efd2c5", "#cfe0e8", "#f0dca0", "#e7b9a1", "#dcd3f0"];
const TORRE = ["#e9e6df", "#d6d2c8", "#c98d6a", "#b9c4cc", "#f1ece2", "#a9b3ba", "#d9b99b"];
const TEJA = ["#b5532f", "#c4643a", "#a84a2b", "#8f3f28"];
const AUTOS = ["#ef4b3f", "#2f80ed", "#f2c94c", "#f4f4f4", "#27ae60", "#1c1c1c", "#9b51e0", "#ff8a3d"];

export interface DatosCiudad {
  cuerpos: Instancia[];
  techos: Instancia[];
  tanques: Instancia[];
  tapas: Instancia[];
  ventanas: Instancia[];
  balcones: Instancia[];
  veredas: Instancia[];
  patios: Instancia[];
  piletas: Instancia[];
  troncos: Instancia[];
  copas: Instancia[];
  rayas: Instancia[];
  postes: Instancia[];
  vehiculos: Vehiculo[];
}

export interface Vehiculo {
  eje: "x" | "z";
  carril: number;
  sentido: 1 | -1;
  velocidad: number;
  inicio: number;
  color: string;
  colectivo: boolean;
}

export function generarCiudad(): DatosCiudad {
  const azar = crearAzar(2024);
  const d: DatosCiudad = {
    cuerpos: [], techos: [], tanques: [], tapas: [], ventanas: [], balcones: [], veredas: [],
    patios: [], piletas: [], troncos: [], copas: [], rayas: [], postes: [], vehiculos: [],
  };

  const centro = { x: -70, z: -75 };

  const tanque = (x: number, y: number, z: number) => {
    const negro = azar.n() < 0.7;
    d.tanques.push({ p: [x, y + 0.55, z], s: [0.55, 1.1, 0.55], c: negro ? "#2a2b2d" : "#5aa7d8" });
    d.tapas.push({ p: [x, y + 1.18, z], s: [0.5, 0.18, 0.5], c: negro ? "#3a3b3e" : "#7cc0ea" });
  };

  const arbol = (x: number, z: number, escala = 1) => {
    const h = azar.entre(1.6, 2.4) * escala;
    d.troncos.push({ p: [x, NIVEL_VEREDA + h / 2, z], s: [0.14, h, 0.14], c: "#6b4a35" });
    const r = azar.n();
    const c = r < 0.14 ? azar.elegir(["#9b7bd8", "#a98be0", "#8c6cc9"]) : r < 0.19 ? "#e58bb5" : azar.elegir(["#5d9b4f", "#6fae5a", "#4f8a45", "#7db865"]);
    const s = azar.entre(1.4, 2.1) * escala;
    d.copas.push({ p: [x, NIVEL_VEREDA + h + s * 0.55, z], s: [s, s * 0.9, s], ry: azar.entre(0, 6), c });
  };

  /** Ubica una construcción mirando hacia la normal (nx, nz). */
  const construir = (
    cx: number, cz: number, nx: number, nz: number, a: number, w: number,
    tipo: "casa" | "ph" | "torre", retiro: number, prof: number,
  ) => {
    const tx = -nz;
    const tz = nx;
    const ry = Math.atan2(nx, nz);
    const frente = LINEA - retiro;
    const b = frente - prof / 2;
    const px = cx + tx * a + nx * b;
    const pz = cz + tz * a + nz * b;
    const base = NIVEL_VEREDA;
    const fx = cx + tx * a + nx * frente;
    const fz = cz + tz * a + nz * frente;
    const enFrente = (u: number, y: number, sx: number, sy: number, salida = 0.05, c?: string, lista = d.ventanas) =>
      lista.push({ p: [fx + tx * u + nx * salida, y, fz + tz * u + nz * salida], s: [sx, sy, 0.1], ry, c });

    if (tipo === "casa") {
      const h = azar.entre(2.9, 3.4);
      const color = azar.elegir(PARED);
      d.cuerpos.push({ p: [px, base + h / 2, pz], s: [w - 0.4, h, prof], ry, c: color });
      if (azar.n() < 0.62) {
        const alto = azar.entre(1.3, 1.9);
        d.techos.push({ p: [px, base + h, pz], s: [w - 0.1, alto, prof + 0.5], ry, c: azar.elegir(TEJA) });
      } else {
        d.cuerpos.push({ p: [px, base + h + 0.2, pz], s: [w - 0.3, 0.4, prof + 0.05], ry, c: "#efe9df" });
        tanque(px - tx * (w / 4), base + h + 0.4, pz - tz * (w / 4));
      }
      enFrente(-w / 4 + 0.1, base + 1.6, 1.0, 1.15, 0.05, "#3c5a70");
      enFrente(w / 4 - 0.2, base + 1.05, 0.95, 2.0, 0.05, azar.elegir(["#5b3b2a", "#2f5d4b", "#7a2e2a"]));
      if (retiro > 1.2 && azar.n() < 0.6) arbol(fx + nx * retiro * 0.5 + tx * (-w / 3), fz + nz * retiro * 0.5 + tz * (-w / 3), 0.8);
      return;
    }

    const pisos = tipo === "ph" ? azar.entero(2, 4) : azar.entero(6, 17);
    const altoPiso = 3;
    const h = pisos * altoPiso + 0.6;
    const color = tipo === "ph" ? azar.elegir(PARED) : azar.elegir(TORRE);
    d.cuerpos.push({ p: [px, base + h / 2, pz], s: [w - 0.3, h, prof], ry, c: color });
    // Azotea con tanque o sala de máquinas.
    if (tipo === "torre") {
      d.cuerpos.push({ p: [px - nx * prof * 0.15, base + h + 1.1, pz - nz * prof * 0.15], s: [w * 0.4, 2.2, prof * 0.35], ry, c: "#cfcac0" });
    }
    tanque(px + tx * (w / 4), base + h, pz + tz * (w / 4));
    const columnas = Math.max(2, Math.floor((w - 1) / 2.3));
    for (let p = 0; p < pisos; p++) {
      const y = base + 1.7 + p * altoPiso;
      for (let k = 0; k < columnas; k++) {
        const u = ((k + 0.5) / columnas - 0.5) * (w - 1.4);
        const luz = azar.n() < 0.1;
        enFrente(u, y, 1.25, 1.55, 0.05, luz ? "#f3d9a4" : azar.elegir(["#35546b", "#3e6075", "#2e4a5e"]));
      }
      if (tipo === "torre" && p > 0 && azar.n() < 0.8) {
        enFrente(0, y - 1.05, w - 0.6, 0.12, 0.5, "#efece6", d.balcones);
        d.balcones[d.balcones.length - 1].s[2] = 1.0;
      }
    }
  };

  for (let i = -N; i <= N; i++) {
    for (let j = -N; j <= N; j++) {
      const cx = i * PASO;
      const cz = CALLE_Z - PASO / 2 + j * PASO;
      const protagonista = i === 0 && j === 0;
      d.veredas.push({ p: [cx, NIVEL_VEREDA / 2, cz], s: [MEDIA * 2, NIVEL_VEREDA, MEDIA * 2], c: "#d9d2c3" });
      d.patios.push({ p: [cx, NIVEL_VEREDA / 2 + 0.01, cz], s: [LINEA * 2, NIVEL_VEREDA, LINEA * 2], c: azar.elegir(["#94bd77", "#8ab46d", "#9fc584"]) });

      const dist = Math.hypot(cx - centro.x, cz - centro.z);
      const urbano = Math.max(0, 1 - dist / 95);
      const tipoAlAzar = (): "casa" | "ph" | "torre" => {
        if (Math.abs(i) <= 1 && Math.abs(j) <= 1 && !(i === -1 && j === -1)) return azar.n() < 0.15 ? "ph" : "casa";
        const r = azar.n();
        if (r < urbano * 0.85) return "torre";
        if (r < urbano * 0.85 + 0.22) return "ph";
        return "casa";
      };

      const lados: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [nx, nz] of lados) {
        const largo = nx === 0 ? LINEA : 2.2;
        if (protagonista && nz === 1) {
          // Frente de la casa protagonista: dos vecinas a los costados.
          construir(cx, cz, nx, nz, -8.05, 6.9, "casa", 2.4, 8.5);
          construir(cx, cz, nx, nz, 8.05, 6.9, "casa", 1.8, 8.5);
          continue;
        }
        let a = -largo;
        while (a < largo - 2) {
          const w = Math.min(largo - a, azar.entre(6.5, 10));
          if (w < 3) break;
          const tipo = tipoAlAzar();
          const retiro = tipo === "casa" ? azar.entre(0, 3) : 0;
          const prof = tipo === "torre" ? azar.entre(8.5, 10) : azar.entre(7, 9);
          construir(cx, cz, nx, nz, a + w / 2, w, tipo, retiro, nx === 0 ? prof : 6.5);
          a += w;
        }
      }
      // Fondos: árboles y alguna pileta.
      for (let k = 0; k < 4; k++) {
        const x = cx + azar.entre(-7, 7);
        const z = cz + azar.entre(-1.6, 1.6);
        if (protagonista && Math.abs(x) < 5) continue;
        if (azar.n() < 0.35) d.piletas.push({ p: [x, NIVEL_VEREDA + 0.03, z], s: [azar.entre(2.5, 4), 0.06, 1.8], c: "#59c3e8" });
        else arbol(x, z, 1.1);
      }
      // Arbolado de vereda.
      for (const [nx, nz] of lados) {
        for (let u = -10.5; u <= 10.5; u += 5.25) {
          if (azar.n() < 0.25) continue;
          const tx = -nz;
          const tz = nx;
          arbol(cx + tx * u + nx * 12.4, cz + tz * u + nz * 12.4);
        }
      }
      // Faroles en las esquinas.
      for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        d.postes.push({ p: [cx + sx * 12.6, NIVEL_VEREDA + 2.2, cz + sz * 12.6], s: [0.08, 4.4, 0.08], c: "#3b4148" });
      }
    }
  }

  // Señalización vial: líneas discontinuas y sendas peatonales.
  const extremo = (N + 0.5) * PASO;
  const blanco = "#f4f1e8";
  // Distancia al eje de la calle transversal más cercana.
  const aCruce = (v: number, eje: number) => {
    const m = (((v - eje) % PASO) + PASO) % PASO;
    return Math.min(m, PASO - m);
  };
  const xCalles = Array.from({ length: 2 * N + 2 }, (_, k) => PASO / 2 + (k - N - 1) * PASO);
  const zCalles = Array.from({ length: 2 * N + 2 }, (_, k) => CALLE_Z + (k - N - 1) * PASO);
  for (const zc of zCalles) {
    for (let x = -extremo; x < extremo; x += 4) {
      if (aCruce(x, PASO / 2) > 6) d.rayas.push({ p: [x, 0.02, zc], s: [1.8, 0.02, 0.14], c: blanco });
    }
  }
  for (const xc of xCalles) {
    for (let z = -extremo + CALLE_Z; z < extremo + CALLE_Z; z += 4) {
      if (aCruce(z, CALLE_Z) > 6) d.rayas.push({ p: [xc, 0.02, z], s: [0.14, 0.02, 1.8], c: blanco });
    }
  }
  // Sendas peatonales a ambos lados de cada cruce.
  for (const xc of xCalles) {
    for (const zc of zCalles) {
      for (let s = -2.7; s <= 2.7; s += 0.9) {
        for (const lado of [-1, 1]) {
          d.rayas.push({ p: [xc + lado * 4.6, 0.02, zc + s], s: [1.6, 0.02, 0.45], c: blanco });
          d.rayas.push({ p: [xc + s, 0.02, zc + lado * 4.6], s: [0.45, 0.02, 1.6], c: blanco });
        }
      }
    }
  }

  // Tránsito.
  for (let k = -N - 1; k <= N; k++) {
    for (const sentido of [1, -1] as const) {
      const cantidad = azar.entero(2, 4);
      for (let v = 0; v < cantidad; v++) {
        const colectivo = azar.n() < 0.16;
        d.vehiculos.push({
          eje: "x", carril: CALLE_Z + k * PASO + sentido * 1.7, sentido,
          velocidad: azar.entre(6, 11), inicio: azar.entre(0, 2 * extremo), colectivo,
          color: colectivo ? azar.elegir(["#e94b3c", "#f2c230", "#2e86de", "#16a085"]) : azar.elegir(AUTOS),
        });
        d.vehiculos.push({
          eje: "z", carril: PASO / 2 + k * PASO - sentido * 1.7, sentido,
          velocidad: azar.entre(6, 11), inicio: azar.entre(0, 2 * extremo), colectivo: false,
          color: azar.elegir(AUTOS),
        });
      }
    }
  }
  return d;
}

/** Prisma triangular unitario (techo a dos aguas) apoyado en y = 0. */
function geometriaDosAguas() {
  const forma = new THREE.Shape();
  forma.moveTo(-0.5, 0);
  forma.lineTo(0.5, 0);
  forma.lineTo(0, 1);
  forma.closePath();
  const g = new THREE.ExtrudeGeometry(forma, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
}

function useGeometrias() {
  return useMemo(() => {
    const caja = new THREE.BoxGeometry(1, 1, 1);
    const cilindro = new THREE.CylinderGeometry(1, 1, 1, 14);
    const cono = new THREE.ConeGeometry(1, 1, 14);
    const copa = new THREE.IcosahedronGeometry(0.5, 1);
    return { caja, cilindro, cono, copa, dosAguas: geometriaDosAguas() };
  }, []);
}

function useMateriales() {
  return useMemo(() => {
    const m = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ color: "#ffffff", ...o });
    return {
      mate: m({ roughness: 0.85 }),
      teja: m({ roughness: 0.7 }),
      vidrio: m({ roughness: 0.15, metalness: 0.3 }),
      plastico: m({ roughness: 0.45 }),
      copa: m({ roughness: 0.9, flatShading: true }),
      agua: m({ roughness: 0.05, metalness: 0.1, emissive: "#1a6f9c", emissiveIntensity: 0.25 }),
      pintura: m({ roughness: 0.35, metalness: 0.2 }),
    };
  }, []);
}

export function Ciudad({ frame, fps, oculta = false }: { frame: number; fps: number; oculta?: boolean }) {
  const datos = useMemo(generarCiudad, []);
  const g = useGeometrias();
  const mat = useMateriales();
  return (
    <group visible={!oculta}>
      {/* Asfalto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[520, 520]} />
        <meshStandardMaterial color="#4b5058" roughness={0.95} />
      </mesh>
      <Instancias items={datos.veredas} geometria={g.caja} material={mat.mate} sombra={false} />
      <Instancias items={datos.patios} geometria={g.caja} material={mat.mate} sombra={false} />
      <Instancias items={datos.rayas} geometria={g.caja} material={mat.mate} sombra={false} />
      <Instancias items={datos.piletas} geometria={g.caja} material={mat.agua} sombra={false} />
      <Instancias items={datos.cuerpos} geometria={g.caja} material={mat.mate} />
      <Instancias items={datos.techos} geometria={g.dosAguas} material={mat.teja} />
      <Instancias items={datos.ventanas} geometria={g.caja} material={mat.vidrio} sombra={false} />
      <Instancias items={datos.balcones} geometria={g.caja} material={mat.mate} />
      <Instancias items={datos.tanques} geometria={g.cilindro} material={mat.plastico} />
      <Instancias items={datos.tapas} geometria={g.cono} material={mat.plastico} />
      <Instancias items={datos.troncos} geometria={g.cilindro} material={mat.mate} />
      <Instancias items={datos.copas} geometria={g.copa} material={mat.copa} />
      <Instancias items={datos.postes} geometria={g.cilindro} material={mat.mate} />
      <Transito vehiculos={datos.vehiculos} frame={frame} fps={fps} caja={g.caja} material={mat.pintura} vidrio={mat.vidrio} />
    </group>
  );
}

function Transito({
  vehiculos, frame, fps, caja, material, vidrio,
}: {
  vehiculos: Vehiculo[]; frame: number; fps: number; caja: THREE.BufferGeometry;
  material: THREE.Material; vidrio: THREE.Material;
}) {
  const mallas = useMemo(() => {
    const cuerpo = new THREE.InstancedMesh(caja, material, vehiculos.length);
    const cabina = new THREE.InstancedMesh(caja, vidrio, vehiculos.length);
    cuerpo.castShadow = true;
    cuerpo.receiveShadow = true;
    return { cuerpo, cabina };
  }, [caja, material, vidrio, vehiculos.length]);

  const extremo = (N + 0.5) * PASO;
  const cuerpos: Instancia[] = [];
  const cabinas: Instancia[] = [];
  for (const v of vehiculos) {
    const recorrido = v.inicio + v.sentido * v.velocidad * (frame / fps);
    const u = ((recorrido % (2 * extremo)) + 2 * extremo) % (2 * extremo) - extremo;
    const ry = v.eje === "x" ? (v.sentido > 0 ? Math.PI / 2 : -Math.PI / 2) : v.sentido > 0 ? 0 : Math.PI;
    const pos: Vec3 = v.eje === "x" ? [u, 0, v.carril] : [v.carril, 0, u];
    if (v.colectivo) {
      cuerpos.push({ p: [pos[0], 1.55, pos[2]], s: [2.5, 2.8, 11], ry, c: v.color });
      cabinas.push({ p: [pos[0], 2.0, pos[2]], s: [2.56, 0.9, 10.2], ry });
    } else {
      cuerpos.push({ p: [pos[0], 0.55, pos[2]], s: [1.8, 0.75, 4.2], ry, c: v.color });
      cabinas.push({ p: [pos[0], 1.15, pos[2]], s: [1.6, 0.6, 2.2], ry });
    }
  }
  escribirInstancias(mallas.cuerpo, cuerpos);
  escribirInstancias(mallas.cabina, cabinas);
  return (
    <group>
      <primitive object={mallas.cuerpo} />
      <primitive object={mallas.cabina} />
    </group>
  );
}
