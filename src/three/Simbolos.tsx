import { useMemo } from "react";
import * as THREE from "three";
import { clamp01, crearAzar, easeInOutCubic, easeOutBack, progreso, type Vec3 } from "../lib/anim";
import { texturaTexto } from "./texturas";

/**
 * Símbolos conceptuales de la escena «¿Un derecho o un negocio?»:
 * facturas que salen de las casas, billetes y monedas que viajan hacia la
 * torre, y un gráfico de ganancias que crece. Es una representación del
 * conflicto entre rentabilidad y servicio, no un dato.
 */

/** Recorrido en arco desde `a` hasta `b` con altura `h`. */
function arco(a: Vec3, b: Vec3, h: number, t: number): Vec3 {
  const x = a[0] + (b[0] - a[0]) * t;
  const z = a[2] + (b[2] - a[2]) * t;
  const y = a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * h;
  return [x, y, z];
}

export function FlujoDinero({
  frame,
  inicio,
  origenes,
  destino,
}: {
  frame: number;
  inicio: number;
  origenes: Vec3[];
  destino: Vec3;
}) {
  const r = useMemo(() => {
    const factura = texturaTexto("FACTURA\n$ — — —", { ancho: 256, alto: 320, tamano: 44, color: "#1d2433", fondo: "#ffffff", borde: "#d32f2f" });
    const signo = texturaTexto("$", { fondo: "#f6c344", color: "#8a5a00", ancho: 128, alto: 128, tamano: 100 });
    const billete = texturaTexto("$", { fondo: "#5fbf6a", color: "#1e5e2a", ancho: 256, alto: 128, tamano: 96, borde: "#2e7d32" });
    const azar = crearAzar(31);
    const items = origenes.map((o, i) => ({
      o,
      demora: i * 4 + azar.entre(0, 6),
      duracion: azar.entre(38, 54),
      tipo: i % 3,
      giro: azar.entre(-1, 1),
    }));
    return {
      factura: new THREE.MeshBasicMaterial({ map: factura, side: THREE.DoubleSide, toneMapped: false }),
      moneda: new THREE.MeshStandardMaterial({ color: "#f6c344", metalness: 0.8, roughness: 0.25, emissive: "#a86f00", emissiveIntensity: 0.4 }),
      caraMoneda: new THREE.MeshBasicMaterial({ map: signo, toneMapped: false }),
      billete: new THREE.MeshBasicMaterial({ map: billete, side: THREE.DoubleSide, toneMapped: false }),
      items,
    };
  }, [origenes]);

  return (
    <group>
      {r.items.map((it, i) => {
        const f = frame - inicio - it.demora;
        if (f < 0) return null;
        // Primero aparece sobre la casa (pop), después viaja a la torre.
        const pop = easeOutBack(progreso(f, 0, 10));
        const viaje = easeInOutCubic(progreso(f, 14, 14 + it.duracion));
        if (viaje >= 1) return null;
        const sobre: Vec3 = [it.o[0], it.o[1] + 5 + pop * 2, it.o[2]];
        const pos = viaje > 0 ? arco(sobre, destino, 14, viaje) : sobre;
        const escala = (it.tipo === 0 ? 4.2 : 3.4) * pop * (1 - viaje * 0.5);
        const rot: Vec3 = [0, frame * 0.08 * it.giro, Math.sin(frame * 0.1 + i) * 0.3];
        if (it.tipo === 0)
          return (
            <mesh key={i} position={pos} rotation={rot} scale={escala} material={r.factura}>
              <planeGeometry args={[0.8, 1.0]} />
            </mesh>
          );
        if (it.tipo === 1)
          return (
            <group key={i} position={pos} rotation={[Math.PI / 2, rot[1], 0]} scale={escala}>
              <mesh material={r.moneda}>
                <cylinderGeometry args={[0.5, 0.5, 0.1, 28]} />
              </mesh>
              <mesh material={r.caraMoneda} position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.42, 28]} />
              </mesh>
              <mesh material={r.caraMoneda} position={[0, -0.052, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.42, 28]} />
              </mesh>
            </group>
          );
        return (
          <mesh key={i} position={pos} rotation={rot} scale={escala} material={r.billete}>
            <planeGeometry args={[1.2, 0.6]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Gráfico de barras de ganancias con flecha ascendente. `p` 0..1. */
export function GraficoGanancias({ position, p, rotacion = 0 }: { position: Vec3; p: number; rotacion?: number }) {
  const r = useMemo(
    () => ({
      panel: new THREE.MeshStandardMaterial({ color: "#0f2236", transparent: true, opacity: 0.55, roughness: 0.4 }),
      barra: new THREE.MeshStandardMaterial({ color: "#3ddc84", emissive: "#1faa59", emissiveIntensity: 0.5, roughness: 0.3 }),
      flecha: new THREE.MeshBasicMaterial({ color: "#f6c344", toneMapped: false }),
      rotulo: new THREE.MeshBasicMaterial({
        map: texturaTexto("GANANCIAS", { fondo: null, color: "#ffffff", ancho: 512, alto: 96, tamano: 64 }),
        transparent: true,
        toneMapped: false,
      }),
    }),
    [],
  );
  if (p <= 0.001) return null;
  const alturas = [3, 4.6, 6.4, 8.8, 12];
  const flecha = progreso(p, 0.55, 1, easeInOutCubic);
  return (
    <group position={position} rotation={[0, rotacion, 0]} scale={easeOutBack(clamp01(p * 3))}>
      <mesh position={[0, 7.5, -0.6]} material={r.panel}>
        <boxGeometry args={[17, 17, 0.3]} />
      </mesh>
      <mesh position={[0, 14.2, -0.4]} material={r.rotulo}>
        <planeGeometry args={[10, 1.9]} />
      </mesh>
      {alturas.map((h, i) => {
        const crece = easeOutBack(progreso(p, 0.1 + i * 0.08, 0.35 + i * 0.08));
        const alto = Math.max(0.01, h * crece);
        return (
          <mesh key={i} position={[-6 + i * 3, 0.5 + alto / 2, 0]} material={r.barra} castShadow>
            <boxGeometry args={[2.2, alto, 1.2]} />
          </mesh>
        );
      })}
      {flecha > 0 ? (
        <group position={[-7, 2, 1]} rotation={[0, 0, Math.atan2(10, 14) - Math.PI / 2]}>
          <mesh position={[0, 8.6 * flecha * 0.5, 0]} material={r.flecha}>
            <cylinderGeometry args={[0.3, 0.3, 8.6 * flecha, 12]} />
          </mesh>
          <mesh position={[0, 8.6 * flecha + 0.8, 0]} material={r.flecha}>
            <coneGeometry args={[0.9, 1.8, 16]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
