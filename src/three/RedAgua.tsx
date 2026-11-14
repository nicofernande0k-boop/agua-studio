import { useMemo } from "react";
import * as THREE from "three";
import { clamp01, type Vec3 } from "../lib/anim";
import { BACHA, CALLE_Z, CANO_MAESTRO, SUELO_TECHO } from "../demo/escena";
import { PASO, datosCiudad, type OpcionesCiudad } from "./Ciudad";

/**
 * Red de agua de toda la ciudad: troncal desde la planta potabilizadora,
 * caños maestros bajo cada calle y una conexión a cada edificio.
 *
 * El agua se dibuja dentro de caños de vidrio. Su avance se controla con
 * `frente`: la distancia (en metros de cañería) que recorrió el agua desde
 * la planta. Bajar `frente` vacía la red desde las puntas; subirlo la llena.
 */

/** Planta potabilizadora: de acá sale el agua. */
export const PLANTA = { x: -158, z: CALLE_Z };
const X_ENTRADA = -PASO * 3.5; // primera calle de la ciudad (lado oeste)
const LARGO_TRONCAL = X_ENTRADA - (PLANTA.x + 12);
const Y_MAESTRO = CANO_MAESTRO.y;
const Y_CONEXION = -1.5;

/** Distancia por la red desde la planta hasta un punto de la calle. */
export function distanciaRed(x: number, z: number) {
  return LARGO_TRONCAL + Math.abs(x - X_ENTRADA) + Math.abs(z - CALLE_Z);
}

/** Distancia máxima de la red (para llenarla o vaciarla entera). */
export const DISTANCIA_MAXIMA = distanciaRed(PASO * 3.5, CALLE_Z + PASO * 3) + 30;

export interface TramoRed {
  a: Vec3;
  b: Vec3;
  r: number;
  /** Distancia acumulada en el extremo `a` (aguas arriba). */
  d0: number;
  largo: number;
  maestro: boolean;
  /** Edificio al que llega (solo conexiones domiciliarias). */
  casa?: [number, number];
}

export interface ConexionExtra {
  x: number;
  z: number;
  calle: [number, number];
}

function tramo(a: Vec3, b: Vec3, r: number, d0: number, maestro: boolean): TramoRed {
  return { a, b, r, d0, largo: Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), maestro };
}

export function generarRed(opciones?: OpcionesCiudad, extras: ConexionExtra[] = []): TramoRed[] {
  const red: TramoRed[] = [];
  const R_MAESTRO = 0.55;
  // Troncal desde la planta.
  red.push(tramo([PLANTA.x + 12, Y_MAESTRO, CALLE_Z], [X_ENTRADA, Y_MAESTRO, CALLE_Z], 0.8, 0, true));

  const xs = Array.from({ length: 8 }, (_, k) => X_ENTRADA + k * PASO);
  const zs = Array.from({ length: 8 }, (_, k) => CALLE_Z - PASO * 4 + k * PASO);
  const orientar = (p: Vec3, q: Vec3) => {
    const dp = distanciaRed(p[0], p[2]);
    const dq = distanciaRed(q[0], q[2]);
    return dp <= dq ? tramo(p, q, R_MAESTRO, dp, true) : tramo(q, p, R_MAESTRO, dq, true);
  };
  for (const z of zs) {
    for (let k = 0; k < xs.length - 1; k++) red.push(orientar([xs[k], Y_MAESTRO, z], [xs[k + 1], Y_MAESTRO, z]));
  }
  for (const x of xs) {
    for (let k = 0; k < zs.length - 1; k++) red.push(orientar([x, Y_MAESTRO, zs[k]], [x, Y_MAESTRO, zs[k + 1]]));
  }

  // Conexiones domiciliarias: casa protagonista, lotes de la ciudad y extras.
  const conexiones: ConexionExtra[] = [
    { x: BACHA[0], z: BACHA[2] + 0.35, calle: [BACHA[0], CALLE_Z] },
    ...datosCiudad(opciones).lotes.map((l) => ({ x: l.x, z: l.z, calle: l.calle })),
    ...extras,
  ];
  for (const c of conexiones) {
    const [mx, mz] = c.calle;
    let d = distanciaRed(mx, mz);
    const p1: Vec3 = [mx, Y_MAESTRO + CANO_MAESTRO.radio * 0.6, mz];
    const p2: Vec3 = [mx, Y_CONEXION, mz];
    const p3: Vec3 = [c.x, Y_CONEXION, c.z];
    const p4: Vec3 = [c.x, SUELO_TECHO + 0.02, c.z];
    const t1 = tramo(p1, p2, 0.15, d, false);
    d += t1.largo;
    const t2 = tramo(p2, p3, 0.15, d, false);
    d += t2.largo;
    const t3 = tramo(p3, p4, 0.15, d, false);
    for (const t of [t1, t2, t3]) t.casa = [c.x, c.z];
    red.push(t1, t2, t3);
  }
  return red;
}

const Y = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Object3D();
const dir = new THREE.Vector3();

function ubicar(malla: THREE.InstancedMesh, i: number, a: Vec3, b: Vec3, r: number, fraccion = 1) {
  dir.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const largo = dir.length();
  dir.normalize();
  const l = Math.max(1e-4, largo * fraccion);
  tmp.position.set(a[0] + dir.x * (l / 2), a[1] + dir.y * (l / 2), a[2] + dir.z * (l / 2));
  tmp.quaternion.setFromUnitVectors(Y, dir);
  tmp.scale.set(r, l, r);
  tmp.updateMatrix();
  malla.setMatrixAt(i, tmp.matrix);
}

function texturaCorriente() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#2a9fe0");
  grad.addColorStop(0.45, "#7fdcff");
  grad.addColorStop(0.55, "#d6f6ff");
  grad.addColorStop(1, "#2a9fe0");
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface PropsRed {
  frame: number;
  /** Metros de cañería recorridos por el agua desde la planta. */
  frente: number;
  /** Válvula: a partir de la distancia `d`, el agua retrocede según `cierre` (0 abierta, 1 cerrada). */
  valvula?: { d: number; cierre: number };
  /** Intensidad del brillo del agua (1 normal, >1 luminosa). */
  brillo?: number;
  /** Opacidad de los caños de vidrio. */
  vidrio?: number;
  visible?: boolean;
  opciones?: OpcionesCiudad;
  extras?: ConexionExtra[];
  /** Agua en cada conexión domiciliaria (0..1), según la posición de la casa. */
  conexion?: (x: number, z: number) => number;
}

export function RedAgua({ frame, frente, valvula, brillo = 1, vidrio = 0.3, visible = true, opciones, extras, conexion }: PropsRed) {
  const red = useMemo(() => generarRed(opciones, extras), [opciones, extras]);
  const recursos = useMemo(() => {
    const cilindro = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true);
    const lleno = new THREE.CylinderGeometry(1, 1, 1, 10);
    const corriente = texturaCorriente();
    corriente.repeat.set(1, 3);
    const matVidrio = new THREE.MeshStandardMaterial({
      color: "#bfeaff", roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.3,
      side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2,
    });
    const matAgua = new THREE.MeshStandardMaterial({
      color: "#4fc3ff", map: corriente, emissive: "#1aa3ff", emissiveMap: corriente, emissiveIntensity: 0.9, roughness: 0.2,
    });
    const matHalo = new THREE.MeshBasicMaterial({
      color: "#4fd2ff", transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const tubos = new THREE.InstancedMesh(cilindro, matVidrio, red.length);
    const agua = new THREE.InstancedMesh(lleno, matAgua, red.length);
    const halo = new THREE.InstancedMesh(lleno, matHalo, red.length);
    red.forEach((t, i) => ubicar(tubos, i, t.a, t.b, t.r));
    tubos.instanceMatrix.needsUpdate = true;
    tubos.computeBoundingSphere();
    tubos.frustumCulled = false;
    agua.frustumCulled = false;
    halo.frustumCulled = false;
    return { tubos, agua, halo, matVidrio, matAgua, matHalo, corriente };
  }, [red]);

  // Corriente: la textura se desplaza a favor del flujo.
  recursos.corriente.offset.y = -frame * 0.045;
  recursos.matAgua.emissiveIntensity = 0.9 * brillo;
  recursos.matHalo.opacity = Math.min(0.55, 0.16 * brillo);
  recursos.matVidrio.opacity = vidrio;

  let visibles = 0;
  red.forEach((t) => {
    let f = frente;
    if (valvula && t.d0 >= valvula.d) f = valvula.d + (frente - valvula.d) * (1 - valvula.cierre);
    let fraccion = clamp01((f - t.d0) / t.largo);
    if (conexion && t.casa) fraccion = Math.min(fraccion, conexion(t.casa[0], t.casa[1]));
    if (fraccion <= 0.001) return;
    const radio = t.r * 0.72;
    ubicar(recursos.agua, visibles, t.a, t.b, radio, fraccion);
    ubicar(recursos.halo, visibles, t.a, t.b, t.r * (t.maestro ? 2.2 : 2.8), fraccion);
    visibles++;
  });
  recursos.agua.count = visibles;
  recursos.halo.count = visibles;
  recursos.agua.instanceMatrix.needsUpdate = true;
  recursos.halo.instanceMatrix.needsUpdate = true;

  return (
    <group visible={visible}>
      <primitive object={recursos.tubos} />
      <primitive object={recursos.agua} />
      <primitive object={recursos.halo} />
    </group>
  );
}
