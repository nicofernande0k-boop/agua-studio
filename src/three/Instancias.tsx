import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Vec3 } from "../lib/anim";

export interface Instancia {
  p: Vec3;
  s: Vec3;
  /** Rotación en Y (radianes). */
  ry?: number;
  /** Rotación completa opcional (x, y, z). */
  r?: Vec3;
  c?: string;
}

const tmp = new THREE.Object3D();
const color = new THREE.Color();
const NOCHE = new THREE.Color("#1d2433");

/**
 * Brillo de cada instancia (1 = color original, 0 = apagada).
 * Recibe la posición para poder encender o apagar edificios por zonas.
 */
export type Tinte = (x: number, z: number) => number;

export function teñirInstancias(malla: THREE.InstancedMesh, items: Instancia[], tinte: Tinte) {
  if (!malla.instanceColor) return;
  items.forEach((it, i) => {
    if (!it.c) return;
    const f = tinte(it.p[0], it.p[2]);
    color.set(it.c);
    if (f < 0.999) color.lerp(NOCHE, (1 - f) * 0.78);
    malla.setColorAt(i, color);
  });
  malla.instanceColor.needsUpdate = true;
}

export function escribirInstancias(malla: THREE.InstancedMesh, items: Instancia[]) {
  items.forEach((it, i) => {
    tmp.position.set(...it.p);
    if (it.r) tmp.rotation.set(...it.r);
    else tmp.rotation.set(0, it.ry ?? 0, 0);
    tmp.scale.set(...it.s);
    tmp.updateMatrix();
    malla.setMatrixAt(i, tmp.matrix);
    if (it.c) malla.setColorAt(i, color.set(it.c));
  });
  malla.instanceMatrix.needsUpdate = true;
  if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
  malla.computeBoundingSphere();
}

/**
 * Muchas copias de una misma geometría en una sola llamada de dibujo.
 * Clave para que la ciudad entera se renderice rápido sin placa de video.
 */
export function Instancias({
  items,
  geometria,
  material,
  sombra = true,
  recibe = true,
  tinte,
}: {
  items: Instancia[];
  geometria: THREE.BufferGeometry;
  material: THREE.Material;
  sombra?: boolean;
  recibe?: boolean;
  tinte?: Tinte;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const cantidad = items.length;
  // Se escribe en el render (no en un efecto) para que el primer fotograma
  // ya tenga todo ubicado.
  const malla = useMemo(() => {
    const m = new THREE.InstancedMesh(geometria, material, Math.max(1, cantidad));
    m.count = cantidad;
    return m;
  }, [geometria, material, cantidad]);
  useMemo(() => escribirInstancias(malla, items), [malla, items]);
  if (tinte) teñirInstancias(malla, items, tinte);
  useLayoutEffect(() => () => malla.dispose(), [malla]);
  return (
    <primitive ref={ref} object={malla} castShadow={sombra} receiveShadow={recibe} />
  );
}
