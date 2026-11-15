import { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "../lib/anim";

/**
 * PATRIA EN DISPUTA — personas.
 *
 * Figuras humanas estilizadas (sin rostro, como esculturas de un documental
 * animado). Toda la multitud se dibuja con una malla instanciada por parte
 * del cuerpo: cientos de personas con muy pocas llamadas de dibujo.
 */

export interface Persona {
  /** Posición de los pies. */
  p: Vec3;
  /** Hacia dónde mira (radianes, 0 = +z). */
  rumbo: number;
  /** 0 quieto … 1 caminando. */
  paso?: number;
  /** Fase del paso (segundos * cadencia). */
  fase?: number;
  /** 0 parado … 1 sentado en el piso (rodillas arriba). */
  sentado?: number;
  /** Brazo derecho / izquierdo hacia adelante (0..1) y flexión del codo (0..1). */
  manoD?: number;
  manoI?: number;
  codo?: number;
  /** Cabeza gacha (0..1) o levantada (negativo). */
  cabeza?: number;
  /** Inclinación del torso hacia adelante (radianes). */
  inclinar?: number;
  /** Escala (chicos ≈ 0.7). */
  escala?: number;
  /** Variación de color 0..1 (crema más clara u oscura). */
  tono?: number;
}

const PARTES = ["torso", "cadera", "cuello", "cabeza", "brazoD", "anteD", "brazoI", "anteI", "musloD", "piernaD", "musloI", "piernaI"] as const;
type Parte = (typeof PARTES)[number];

function geometrias(): Record<Parte, THREE.BufferGeometry> {
  // Torso esculpido: hombros anchos, cintura, pecho.
  const perfil = [
    [0.001, 0], [0.13, 0.0], [0.15, 0.06], [0.14, 0.16], [0.155, 0.3], [0.19, 0.42], [0.2, 0.5], [0.16, 0.55], [0.06, 0.58], [0.001, 0.585],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = new THREE.LatheGeometry(perfil, 20);
  torso.scale(1, 1, 0.62);
  const cadera = new THREE.SphereGeometry(0.15, 18, 12);
  cadera.scale(1.05, 0.75, 0.75);
  const cuello = new THREE.CylinderGeometry(0.045, 0.055, 0.1, 12);
  const cabeza = new THREE.SphereGeometry(0.105, 24, 18);
  cabeza.scale(0.88, 1.12, 0.98);
  const miembro = (r0: number, r1: number, largo: number) => {
    const g = new THREE.CapsuleGeometry((r0 + r1) / 2, largo, 6, 12);
    g.translate(0, -largo / 2 - (r0 + r1) / 2, 0);
    return g;
  };
  return {
    torso,
    cadera,
    cuello,
    cabeza,
    brazoD: miembro(0.05, 0.045, 0.24),
    anteD: miembro(0.042, 0.035, 0.24),
    brazoI: miembro(0.05, 0.045, 0.24),
    anteI: miembro(0.042, 0.035, 0.24),
    musloD: miembro(0.075, 0.06, 0.34),
    piernaD: miembro(0.058, 0.045, 0.36),
    musloI: miembro(0.075, 0.06, 0.34),
    piernaI: miembro(0.058, 0.045, 0.36),
  };
}

const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v = new THREE.Vector3();
const s1 = new THREE.Vector3(1, 1, 1);

/** Matriz local: traslación (x,y,z) y rotación (rx,ry,rz). */
function local(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
  e.set(rx, ry, rz);
  q.setFromEuler(e);
  v.set(x, y, z);
  return new THREE.Matrix4().compose(v, q, s1);
}

/** Calcula la matriz de cada parte del cuerpo para una persona. */
export function matricesPersona(pr: Persona): Record<Parte, THREE.Matrix4> {
  const k = pr.escala ?? 1;
  const paso = pr.paso ?? 0;
  const fase = pr.fase ?? 0;
  const sent = pr.sentado ?? 0;
  const sw = Math.sin(fase) * paso;
  const rebote = Math.abs(Math.cos(fase)) * 0.025 * paso;
  const alturaCadera = 0.92 * (1 - sent) + 0.16 * sent + rebote;

  e.set(0, pr.rumbo, 0);
  q.setFromEuler(e);
  const base = new THREE.Matrix4().compose(new THREE.Vector3(...pr.p), q, new THREE.Vector3(k, k, k));

  const inclinar = (pr.inclinar ?? 0) + 0.04 * paso + sent * 0.15;
  const cadera = base.clone().multiply(local(0, alturaCadera, 0));
  const torso = cadera.clone().multiply(local(0, 0.02, 0, inclinar, sw * 0.08, 0));
  const cuello = torso.clone().multiply(local(0, 0.6, 0.0, 0.1));
  const cabeza = cuello.clone().multiply(local(0, 0.14, 0.01, (pr.cabeza ?? 0) * 0.6));

  const brazo = (lado: 1 | -1, adelante: number) => {
    const balanceo = -sw * 0.45 * lado;
    const rx = -(adelante * 1.35) + balanceo * (1 - adelante);
    const hombro = torso.clone().multiply(local(lado * 0.2, 0.5, 0, rx, 0, lado * 0.12 + sent * lado * 0.2));
    const codo = -(pr.codo ?? 0) * 1.4 - 0.15 - Math.max(0, balanceo) * 0.3;
    const ante = hombro.clone().multiply(local(0, -0.33, 0, codo));
    return [hombro, ante] as const;
  };
  const [brazoD, anteD] = brazo(1, pr.manoD ?? 0);
  const [brazoI, anteI] = brazo(-1, pr.manoI ?? 0);

  const pierna = (lado: 1 | -1) => {
    const avance = sw * 0.55 * lado;
    const rx = -avance - sent * 1.95;
    const muslo = cadera.clone().multiply(local(lado * 0.09, -0.02, 0, rx));
    const flex = Math.max(0, -Math.sin(fase + (lado > 0 ? 0 : Math.PI))) * 0.7 * paso + sent * 1.15;
    const rodilla = muslo.clone().multiply(local(0, -0.43, 0, flex));
    return [muslo, rodilla] as const;
  };
  const [musloD, piernaD] = pierna(1);
  const [musloI, piernaI] = pierna(-1);

  return { torso, cadera, cuello, cabeza, brazoD, anteD, brazoI, anteI, musloD, piernaD, musloI, piernaI };
}

/** Multitud instanciada. `personas` se recalcula en cada fotograma. */
export function Multitud({
  personas,
  material,
  sombras = true,
}: {
  personas: Persona[];
  material?: THREE.Material;
  sombras?: boolean;
}) {
  const r = useMemo(() => {
    const g = geometrias();
    const mat =
      material ??
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55, metalness: 0.0 });
    const mallas = {} as Record<Parte, THREE.InstancedMesh>;
    for (const p of PARTES) {
      const im = new THREE.InstancedMesh(g[p], mat, 600);
      im.castShadow = sombras;
      im.receiveShadow = true;
      im.frustumCulled = false;
      mallas[p] = im;
    }
    return { mallas };
  }, [material, sombras]);

  const color = new THREE.Color();
  personas.forEach((pr, i) => {
    const mats = matricesPersona(pr);
    const tono = pr.tono ?? 0.5;
    color.setHSL(0.09, 0.22 + tono * 0.1, 0.78 + (tono - 0.5) * 0.12);
    for (const p of PARTES) {
      r.mallas[p].setMatrixAt(i, mats[p]);
      r.mallas[p].setColorAt(i, color);
    }
  });
  for (const p of PARTES) {
    const im = r.mallas[p];
    im.count = personas.length;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  return (
    <group>
      {PARTES.map((p) => (
        <primitive key={p} object={r.mallas[p]} />
      ))}
    </group>
  );
}

/** Posición de la mano derecha (para enganchar el hilo rojo). */
export function manoDerecha(pr: Persona): Vec3 {
  const mats = matricesPersona(pr);
  const p = new THREE.Vector3(0, -0.3, 0).applyMatrix4(mats.anteD);
  return [p.x, p.y, p.z];
}
export function manoIzquierda(pr: Persona): Vec3 {
  const mats = matricesPersona(pr);
  const p = new THREE.Vector3(0, -0.3, 0).applyMatrix4(mats.anteI);
  return [p.x, p.y, p.z];
}
