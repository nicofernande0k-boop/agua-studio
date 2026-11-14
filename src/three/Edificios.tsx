import { useMemo } from "react";
import * as THREE from "three";
import { clamp01, easeOutBack, easeOutCubic, progreso, type Vec3 } from "../lib/anim";
import { CALLE_Z } from "../demo/escena";
import { Instancias, type Instancia } from "./Instancias";
import { NIVEL_VEREDA, PASO } from "./Ciudad";
import { texturaBandera, texturaTexto } from "./texturas";

/**
 * Edificios especiales que se suman a la ciudad: hospital, escuela, torre
 * corporativa, válvula gigante y planta potabilizadora. Mismo lenguaje
 * visual que el resto: volúmenes simples, colores suaves, detalles legibles.
 */

const m = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });

/** Grilla de ventanas sobre una fachada que mira a +z. */
function ventanasFachada(cx: number, z: number, ancho: number, pisos: number, cols: number, y0: number, altoPiso: number, color: string): Instancia[] {
  const v: Instancia[] = [];
  for (let p = 0; p < pisos; p++) {
    for (let k = 0; k < cols; k++) {
      const x = cx + ((k + 0.5) / cols - 0.5) * (ancho - 2);
      v.push({ p: [x, y0 + p * altoPiso, z], s: [1.3, 1.5, 0.12], c: color });
    }
  }
  return v;
}

export const POS_HOSPITAL: Vec3 = [PASO, 0, 0];
export const POS_ESCUELA: Vec3 = [-PASO, 0, 1];
export const POS_TORRE: Vec3 = [PASO, 0, CALLE_Z + PASO / 2];
export const POS_VALVULA: Vec3 = [PASO / 2, 0, CALLE_Z];

/** Opciones de la ciudad para dejar lugar a los edificios especiales. */
export const OPCIONES_CIUDAD_001 = {
  reservado: (i: number, j: number, _nx: number, nz: number) => j === 0 && Math.abs(i) === 1 && nz === 1,
  plazas: [[1, 1]] as [number, number][],
};

/** Conexiones de agua de los edificios especiales. */
export const CONEXIONES_ESPECIALES = [
  { x: POS_HOSPITAL[0], z: POS_HOSPITAL[2], calle: [POS_HOSPITAL[0], CALLE_Z] as [number, number] },
  { x: POS_ESCUELA[0], z: POS_ESCUELA[2], calle: [POS_ESCUELA[0], CALLE_Z] as [number, number] },
];

export function Hospital({ brillo = 1 }: { brillo?: number }) {
  const r = useMemo(() => {
    const cartel = texturaTexto("HOSPITAL", { color: "#d32f2f", fondo: "#ffffff", ancho: 512, alto: 112, tamano: 70 });
    return {
      blanco: m({ color: "#f3f5f7" }),
      banda: m({ color: "#7fb8e6" }),
      rojo: m({ color: "#e53935", emissive: "#e53935", emissiveIntensity: 0.35 }),
      vidrio: m({ color: "#ffffff", roughness: 0.15, metalness: 0.3 }),
      gris: m({ color: "#c9cdd2" }),
      cartel: new THREE.MeshBasicMaterial({ map: cartel, toneMapped: false }),
      ventanas: ventanasFachada(0, 6.06, 20, 4, 8, 1.9, 2.9, "#3e6075"),
      caja: new THREE.BoxGeometry(1, 1, 1),
    };
  }, []);
  r.blanco.color.set("#f3f5f7").multiplyScalar(0.3 + 0.7 * brillo);
  r.banda.color.set("#7fb8e6").multiplyScalar(0.3 + 0.7 * brillo);
  r.gris.color.set("#c9cdd2").multiplyScalar(0.3 + 0.7 * brillo);
  return (
    <group position={POS_HOSPITAL}>
      <mesh position={[0, NIVEL_VEREDA + 6, 0]} material={r.blanco} castShadow receiveShadow>
        <boxGeometry args={[20, 12, 12]} />
      </mesh>
      <mesh position={[-6, NIVEL_VEREDA + 3.75, -9]} material={r.blanco} castShadow receiveShadow>
        <boxGeometry args={[12, 7.5, 6]} />
      </mesh>
      {[3, 6, 9].map((y) => (
        <mesh key={y} position={[0, NIVEL_VEREDA + y, 0]} material={r.banda}>
          <boxGeometry args={[20.15, 0.35, 12.15]} />
        </mesh>
      ))}
      <Instancias items={r.ventanas} geometria={r.caja} material={r.vidrio} sombra={false} />
      {/* Cruz en fachada y en la azotea */}
      <group position={[7.5, NIVEL_VEREDA + 10.4, 6.12]}>
        <mesh material={r.rojo}><boxGeometry args={[2.6, 0.8, 0.2]} /></mesh>
        <mesh material={r.rojo}><boxGeometry args={[0.8, 2.6, 0.2]} /></mesh>
      </group>
      <group position={[0, NIVEL_VEREDA + 12.05, 0]}>
        <mesh material={r.gris}><cylinderGeometry args={[3.6, 3.6, 0.08, 40]} /></mesh>
        <mesh material={r.rojo} position={[0, 0.06, 0]}><boxGeometry args={[4.2, 0.06, 1.3]} /></mesh>
        <mesh material={r.rojo} position={[0, 0.06, 0]}><boxGeometry args={[1.3, 0.06, 4.2]} /></mesh>
      </group>
      {/* Entrada con alero y cartel */}
      <mesh position={[0, NIVEL_VEREDA + 3.1, 7.6]} material={r.blanco} castShadow>
        <boxGeometry args={[7, 0.3, 3.2]} />
      </mesh>
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, NIVEL_VEREDA + 1.5, 8.9]} material={r.gris}>
          <cylinderGeometry args={[0.12, 0.12, 3, 12]} />
        </mesh>
      ))}
      <mesh position={[0, NIVEL_VEREDA + 3.95, 7.6]} material={r.cartel}>
        <planeGeometry args={[5.2, 1.14]} />
      </mesh>
      {/* Ambulancia */}
      <group position={[6, 0, 10.9]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.2, 0]} material={r.blanco} castShadow>
          <boxGeometry args={[2.1, 2.1, 5]} />
        </mesh>
        <mesh position={[0, 1.0, 0]} material={r.rojo}>
          <boxGeometry args={[2.12, 0.3, 5.02]} />
        </mesh>
        <mesh position={[0, 2.35, 1.6]} material={r.rojo}>
          <boxGeometry args={[1.2, 0.2, 0.3]} />
        </mesh>
      </group>
    </group>
  );
}

export function Escuela({ frame, brillo = 1 }: { frame: number; brillo?: number }) {
  const r = useMemo(() => {
    const cartel = texturaTexto("ESCUELA", { color: "#1d3557", fondo: "#ffffff", ancho: 512, alto: 112, tamano: 72 });
    const bandera = new THREE.PlaneGeometry(2.6, 1.65, 16, 6);
    return {
      ladrillo: m({ color: "#d9825b" }),
      blanco: m({ color: "#f6f1e7" }),
      vidrio: m({ color: "#ffffff", roughness: 0.15, metalness: 0.3 }),
      patio: m({ color: "#d8d4cb" }),
      cartel: new THREE.MeshBasicMaterial({ map: cartel, toneMapped: false }),
      bandera: new THREE.MeshStandardMaterial({ map: texturaBandera(), side: THREE.DoubleSide, roughness: 0.9 }),
      geoBandera: bandera,
      base: Float32Array.from(bandera.attributes.position.array as Float32Array),
      ventanas: ventanasFachada(0, 6.06, 20, 2, 8, 2.1, 3.4, "#ffffff"),
      caja: new THREE.BoxGeometry(1, 1, 1),
    };
  }, []);
  r.ladrillo.color.set("#d9825b").multiplyScalar(0.3 + 0.7 * brillo);
  r.blanco.color.set("#f6f1e7").multiplyScalar(0.3 + 0.7 * brillo);
  // Bandera flameando: onda que viaja desde el mástil.
  const pos = r.geoBandera.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = r.base[i * 3];
    const y = r.base[i * 3 + 1];
    const u = (x + 1.3) / 2.6;
    pos.setZ(i, Math.sin(u * 5 - frame * 0.22 + y * 0.6) * 0.18 * u);
  }
  pos.needsUpdate = true;
  r.geoBandera.computeVertexNormals();

  return (
    <group position={POS_ESCUELA}>
      <mesh position={[0, NIVEL_VEREDA + 3.6, 0]} material={r.ladrillo} castShadow receiveShadow>
        <boxGeometry args={[20, 7.2, 10]} />
      </mesh>
      <mesh position={[0, NIVEL_VEREDA + 7.35, 0]} material={r.blanco} castShadow>
        <boxGeometry args={[20.6, 0.5, 10.6]} />
      </mesh>
      <Instancias items={r.ventanas} geometria={r.caja} material={r.vidrio} sombra={false} tinte={() => brillo} />
      {/* Pórtico */}
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <mesh key={x} position={[x, NIVEL_VEREDA + 2.5, 6.6]} material={r.blanco} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 5, 14]} />
        </mesh>
      ))}
      <mesh position={[0, NIVEL_VEREDA + 5.25, 6.6]} material={r.blanco} castShadow>
        <boxGeometry args={[6.2, 0.5, 1.6]} />
      </mesh>
      <mesh position={[0, NIVEL_VEREDA + 6.0, 6.7]} material={r.cartel}>
        <planeGeometry args={[4.6, 1.0]} />
      </mesh>
      {/* Patio */}
      <mesh position={[0, NIVEL_VEREDA + 0.02, -8.5]} material={r.patio} receiveShadow>
        <boxGeometry args={[18, 0.04, 7]} />
      </mesh>
      {/* Mástil y bandera */}
      <mesh position={[7.5, NIVEL_VEREDA + 4.5, 8.3]} material={r.blanco}>
        <cylinderGeometry args={[0.07, 0.09, 9, 10]} />
      </mesh>
      <mesh geometry={r.geoBandera} material={r.bandera} position={[8.85, NIVEL_VEREDA + 8.0, 8.3]} castShadow />
    </group>
  );
}

/** Torre corporativa que emerge en la plaza. `p` va de 0 (oculta) a 1 (completa). */
export function TorreCorporativa({ frame, p }: { frame: number; p: number }) {
  const r = useMemo(() => {
    const signo = texturaTexto("$", { fondo: null, color: "#f6c344", ancho: 256, alto: 256, tamano: 220 });
    const aletas: Instancia[] = [];
    for (let k = 0; k < 9; k++) {
      const u = -7 + k * 1.75;
      for (const [x, z, ry] of [[u, 8.05, 0], [u, -8.05, 0], [8.05, u, Math.PI / 2], [-8.05, u, Math.PI / 2]] as const) {
        aletas.push({ p: [x, 35, z], s: [0.25, 70, 0.5], ry, c: "#9fb3c4" });
      }
    }
    return {
      vidrio: m({ color: "#24384c", roughness: 0.1, metalness: 0.75, envMapIntensity: 1.6 }),
      corona: m({ color: "#e9edf0", roughness: 0.4 }),
      oro: m({ color: "#f6c344", roughness: 0.25, metalness: 0.8, emissive: "#f6a800", emissiveIntensity: 0.35 }),
      signo: new THREE.MeshBasicMaterial({ map: signo, transparent: true, toneMapped: false, side: THREE.DoubleSide }),
      polvo: new THREE.MeshBasicMaterial({ color: "#d9cdb8", transparent: true, depthWrite: false }),
      aletas,
      caja: new THREE.BoxGeometry(1, 1, 1),
    };
  }, []);
  if (p <= 0.001) return null;
  const alto = easeOutCubic(clamp01(p));
  const polvo = progreso(p, 0, 0.7);
  r.polvo.opacity = 0.55 * (1 - polvo);
  return (
    <group position={POS_TORRE}>
      <group scale={[1, Math.max(0.001, alto), 1]}>
        <mesh position={[0, 35, 0]} material={r.vidrio} castShadow receiveShadow>
          <boxGeometry args={[16, 70, 16]} />
        </mesh>
        <Instancias items={r.aletas} geometria={r.caja} material={r.corona} sombra={false} />
        <mesh position={[0, 71.5, 0]} material={r.corona} castShadow>
          <boxGeometry args={[12, 3, 12]} />
        </mesh>
      </group>
      {/* Emblema con signo $ que gira sobre la torre */}
      <group position={[0, 70 * alto + 8, 0]} rotation={[0, frame * 0.03, 0]} scale={alto}>
        <mesh material={r.oro} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.2, 4.2, 0.8, 48]} />
        </mesh>
        <mesh material={r.signo} position={[0, 0, 0.45]}>
          <planeGeometry args={[6.4, 6.4]} />
        </mesh>
        <mesh material={r.signo} position={[0, 0, -0.45]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[6.4, 6.4]} />
        </mesh>
      </group>
      {/* Anillo de polvo al emerger */}
      {polvo < 1 ? (
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={r.polvo}>
          <ringGeometry args={[8 + polvo * 10, 10 + polvo * 16, 48]} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Válvula gigante sobre la red. `sube` 0..1 la hace emerger; `cierre` 0..1 gira el volante. */
export function ValvulaGigante({ sube, cierre }: { sube: number; cierre: number }) {
  const r = useMemo(
    () => ({
      azul: m({ color: "#2c6fb0", roughness: 0.35, metalness: 0.5 }),
      rojo: m({ color: "#d33b2c", roughness: 0.35, metalness: 0.3 }),
      metal: m({ color: "#9aa4ad", roughness: 0.3, metalness: 0.9 }),
    }),
    [],
  );
  if (sube <= 0.001) return null;
  const y = -16 + 16 * easeOutBack(clamp01(sube));
  return (
    <group position={[POS_VALVULA[0], y, POS_VALVULA[2]]}>
      {/* Tramo de caño con bridas */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 2.2, 0]} material={r.azul} castShadow>
        <cylinderGeometry args={[2.0, 2.0, 16, 40]} />
      </mesh>
      {[-7.5, -3, 3, 7.5].map((x) => (
        <mesh key={x} rotation={[0, 0, Math.PI / 2]} position={[x, 2.2, 0]} material={r.azul}>
          <cylinderGeometry args={[2.4, 2.4, 0.6, 40]} />
        </mesh>
      ))}
      {/* Cuerpo, vástago y volante */}
      <mesh position={[0, 2.2, 0]} material={r.azul} castShadow>
        <sphereGeometry args={[2.9, 32, 24]} />
      </mesh>
      <mesh position={[0, 6.2, 0]} material={r.azul} castShadow>
        <cylinderGeometry args={[1.3, 1.8, 3.5, 32]} />
      </mesh>
      <mesh position={[0, 9.6, 0]} material={r.metal}>
        <cylinderGeometry args={[0.35, 0.35, 4, 16]} />
      </mesh>
      <group position={[0, 11.4, 0]} rotation={[0, cierre * Math.PI * 2.5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={r.rojo} castShadow>
          <torusGeometry args={[4.2, 0.45, 16, 56]} />
        </mesh>
        {[0, 1, 2].map((k) => (
          <mesh key={k} rotation={[0, (k * Math.PI) / 3, 0]} material={r.rojo}>
            <boxGeometry args={[8.4, 0.4, 0.4]} />
          </mesh>
        ))}
        <mesh material={r.rojo}>
          <cylinderGeometry args={[0.8, 0.8, 0.8, 24]} />
        </mesh>
      </group>
    </group>
  );
}

/** Planta potabilizadora junto al río, al oeste de la ciudad. */
export function Planta({ frame, x, z, actividad }: { frame: number; x: number; z: number; actividad: number }) {
  const r = useMemo(() => {
    const cartel = texturaTexto("PLANTA POTABILIZADORA", { color: "#ffffff", fondo: "#1f6fb2", ancho: 1024, alto: 128, tamano: 70 });
    const rio = document.createElement("canvas");
    rio.width = 64;
    rio.height = 256;
    const g = rio.getContext("2d")!;
    g.fillStyle = "#3d8fc4";
    g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,255,255,${0.08 + (i % 3) * 0.04})`;
      g.fillRect((i * 37) % 64, (i * 53) % 256, 18, 3);
    }
    const tRio = new THREE.CanvasTexture(rio);
    tRio.wrapS = tRio.wrapT = THREE.RepeatWrapping;
    tRio.repeat.set(1, 12);
    tRio.colorSpace = THREE.SRGBColorSpace;
    return {
      pasto: m({ color: "#9cc27f" }),
      hormigon: m({ color: "#cfcac0" }),
      agua: m({ color: "#5bc0eb", roughness: 0.05, metalness: 0.1, emissive: "#1aa3ff", emissiveIntensity: 0.2 }),
      rio: m({ map: tRio, roughness: 0.1, metalness: 0.1 }),
      tRio,
      blanco: m({ color: "#f3f5f7" }),
      azul: m({ color: "#2c6fb0", roughness: 0.35, metalness: 0.5 }),
      celeste: m({ color: "#a8d8f0", roughness: 0.4 }),
      baranda: m({ color: "#f2c230", roughness: 0.4 }),
      cartel: new THREE.MeshBasicMaterial({ map: cartel, toneMapped: false }),
    };
  }, []);
  r.tRio.offset.y = frame * 0.006;
  r.agua.emissiveIntensity = 0.2 + actividad * 0.9;
  const giro = frame * 0.02;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]} material={r.pasto} receiveShadow>
        <boxGeometry args={[70, 0.24, 90]} />
      </mesh>
      {/* Río */}
      <mesh position={[-44, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={r.rio}>
        <planeGeometry args={[16, 420]} />
      </mesh>
      {/* Toma de agua */}
      <mesh position={[-30, 0.9, -6]} rotation={[0, 0, Math.PI / 2]} material={r.azul} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 24, 20]} />
      </mesh>
      {/* Decantadores circulares con puente giratorio */}
      {[-14, 14].map((dz) => (
        <group key={dz} position={[-14, 0, dz]}>
          <mesh position={[0, 1.3, 0]} material={r.hormigon} castShadow receiveShadow>
            <cylinderGeometry args={[8, 8, 2.6, 56, 1, true]} />
          </mesh>
          <mesh position={[0, 2.4, 0]} material={r.agua} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[7.8, 56]} />
          </mesh>
          <group position={[0, 3.0, 0]} rotation={[0, giro * (dz > 0 ? 1 : -1), 0]}>
            <mesh material={r.blanco} castShadow>
              <boxGeometry args={[16, 0.4, 1.4]} />
            </mesh>
            <mesh material={r.baranda} position={[0, 0.6, 0.65]}>
              <boxGeometry args={[16, 0.08, 0.08]} />
            </mesh>
          </group>
          <mesh position={[0, 2.9, 0]} material={r.hormigon}>
            <cylinderGeometry args={[0.9, 0.9, 1.2, 20]} />
          </mesh>
        </group>
      ))}
      {/* Filtros */}
      {[0, 1].map((i) =>
        [0, 1, 2].map((j) => (
          <group key={`${i}-${j}`} position={[2 + j * 8, 0, -26 + i * 9]}>
            <mesh position={[0, 0.9, 0]} material={r.hormigon} castShadow receiveShadow>
              <boxGeometry args={[7, 1.8, 8]} />
            </mesh>
            <mesh position={[0, 1.82, 0]} material={r.agua}>
              <boxGeometry args={[6.2, 0.05, 7.2]} />
            </mesh>
          </group>
        )),
      )}
      {/* Edificio con cartel */}
      <mesh position={[10, 3.5, 22]} material={r.blanco} castShadow receiveShadow>
        <boxGeometry args={[18, 7, 10]} />
      </mesh>
      <mesh position={[10, 5.6, 27.05]} material={r.cartel}>
        <planeGeometry args={[16, 2]} />
      </mesh>
      {/* Tanque elevado */}
      <group position={[22, 0, -24]}>
        {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([a, b], i) => (
          <mesh key={i} position={[a, 7, b]} material={r.hormigon}>
            <cylinderGeometry args={[0.35, 0.35, 14, 12]} />
          </mesh>
        ))}
        <mesh position={[0, 17, 0]} material={r.celeste} castShadow>
          <cylinderGeometry args={[4.4, 3.6, 6, 32]} />
        </mesh>
        <mesh position={[0, 20.6, 0]} material={r.celeste}>
          <coneGeometry args={[4.6, 1.4, 32]} />
        </mesh>
      </group>
      {/* Caño de salida hacia la ciudad */}
      <mesh position={[16, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} material={r.azul} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 16, 20]} />
      </mesh>
      <mesh position={[24, -0.6, 0]} material={r.azul}>
        <cylinderGeometry args={[0.8, 0.8, 3.6, 20]} />
      </mesh>
    </group>
  );
}
