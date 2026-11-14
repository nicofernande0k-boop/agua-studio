import { useMemo } from "react";
import * as THREE from "three";
import { easeInOutCubic, easeOutCubic, progreso, type Vec3 } from "../lib/anim";
import { ALTURA_PARED, BANO, PISO, T } from "../demo/escena";
import { texturaAzulejos, texturaDamero, texturaTejas } from "./texturas";

/**
 * Casa protagonista: chalet con techo de tejas a dos aguas, tanque de agua,
 * jardín con reja y, adentro, un baño completo. El techo se desvanece cuando
 * la cámara lo atraviesa (corte arquitectónico).
 */

type Caja = { p: Vec3; s: Vec3; c?: string };

const mat = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);

/** Divide una pared en bloques dejando huecos rectangulares (puertas, ventanas). */
function paredConHuecos(
  largo: number,
  alto: number,
  huecos: { u0: number; u1: number; y0: number; y1: number }[],
) {
  const cortes = [-largo / 2, largo / 2, ...huecos.flatMap((h) => [h.u0, h.u1])].sort((a, b) => a - b);
  const bloques: { u: number; w: number; y0: number; y1: number }[] = [];
  for (let i = 0; i < cortes.length - 1; i++) {
    const a = cortes[i];
    const b = cortes[i + 1];
    if (b - a < 1e-3) continue;
    const medio = (a + b) / 2;
    const h = huecos.find((x) => medio > x.u0 && medio < x.u1);
    if (!h) bloques.push({ u: medio, w: b - a, y0: 0, y1: alto });
    else {
      if (h.y0 > 0) bloques.push({ u: medio, w: b - a, y0: 0, y1: h.y0 });
      if (h.y1 < alto) bloques.push({ u: medio, w: b - a, y0: h.y1, y1: alto });
    }
  }
  return bloques;
}

function Cajas({ cajas, material, sombra = true }: { cajas: Caja[]; material: THREE.Material; sombra?: boolean }) {
  return (
    <>
      {cajas.map((c, i) => (
        <mesh key={i} position={c.p} castShadow={sombra} receiveShadow material={material}>
          <boxGeometry args={c.s} />
        </mesh>
      ))}
    </>
  );
}

/** Momentos (en fotogramas) de las animaciones de la casa. */
export interface TiemposCasa {
  techoDesvanece: readonly [number, number];
  abreCanilla: readonly [number, number];
  gota: readonly [number, number];
}

/** Tiempos que nunca ocurren: casa quieta, con techo. */
export const CASA_QUIETA: TiemposCasa = {
  techoDesvanece: [1e9, 1e9 + 1],
  abreCanilla: [1e9, 1e9 + 1],
  gota: [1e9, 1e9 + 1],
};

export function Casa({ frame, oculta, tiempos = T }: { frame: number; oculta: boolean; tiempos?: TiemposCasa }) {
  const m = useMemo(() => {
    const tejas = texturaTejas();
    tejas.center.set(0.5, 0.5);
    tejas.rotation = Math.PI / 2;
    tejas.repeat.set(2.2, 6);
    const azulejos = texturaAzulejos();
    const damero = texturaDamero();
    damero.repeat.set((BANO.x1 - BANO.x0) / 1.2, (BANO.z1 - BANO.z0) / 1.2);
    return {
      fachada: mat({ color: "#f3e2c4", roughness: 0.9 }),
      zocalo: mat({ color: "#b9ad9a", roughness: 0.95 }),
      interior: mat({ color: "#f1ede6", roughness: 0.95 }),
      salvia: mat({ color: "#cfe3da", roughness: 0.9 }),
      marco: mat({ color: "#fbfaf6", roughness: 0.5 }),
      persiana: mat({ color: "#2f6b55", roughness: 0.6 }),
      madera: mat({ color: "#7a4b2e", roughness: 0.6 }),
      vidrio: mat({ color: "#6f93a8", roughness: 0.08, metalness: 0.4 }),
      reja: mat({ color: "#1d1f22", roughness: 0.5, metalness: 0.6 }),
      piso: mat({ color: "#d7cfc2", roughness: 0.8 }),
      damero: mat({ map: damero, roughness: 0.35 }),
      azulejos,
      tejas: mat({ map: tejas, roughness: 0.7, transparent: true }),
      cielorraso: mat({ color: "#f4f1ea", roughness: 0.95, transparent: true }),
      hastial: mat({ color: "#f3e2c4", roughness: 0.9, transparent: true }),
      tanque: mat({ color: "#26272a", roughness: 0.4, transparent: true }),
      hierro: mat({ color: "#555a60", roughness: 0.5, metalness: 0.6, transparent: true }),
      sillon: mat({ color: "#e0784f", roughness: 0.85 }),
      cama: mat({ color: "#9cc3e6", roughness: 0.85 }),
      mesa: mat({ color: "#a8754d", roughness: 0.6 }),
    };
  }, []);

  // Fundido del techo al atravesarlo.
  const opTecho = 1 - progreso(frame, tiempos.techoDesvanece[0], tiempos.techoDesvanece[1], easeInOutCubic);
  for (const x of [m.tejas, m.cielorraso, m.hastial, m.tanque, m.hierro]) {
    x.opacity = opTecho;
    x.depthWrite = opTecho > 0.98;
    x.visible = opTecho > 0.01;
  }
  const techoProyectaSombra = frame < tiempos.techoDesvanece[0];

  const H = ALTURA_PARED - PISO; // alto de pared sobre el piso
  const yP = (y: number) => PISO + y;

  // Pared del frente (z = 5) con puerta y dos ventanas.
  const frente = paredConHuecos(8, H, [
    { u0: -2.7, u1: -1.7, y0: 0, y1: 2.15 },
    { u0: -0.9, u1: 0.5, y0: 0.9, y1: 2.2 },
    { u0: 1.4, u1: 3.0, y0: 0.9, y1: 2.2 },
  ]);
  const exteriores: Caja[] = [
    ...frente.map((b) => ({ p: [b.u, yP((b.y0 + b.y1) / 2), 4.9] as Vec3, s: [b.w, b.y1 - b.y0, 0.2] as Vec3 })),
    { p: [0, yP(H / 2), -4.9], s: [8, H, 0.2] },
    { p: [-3.9, yP(H / 2), 0], s: [0.2, H, 9.6] },
    { p: [3.9, yP(H / 2), 0], s: [0.2, H, 9.6] },
  ];
  const tabiques: Caja[] = [
    { p: [BANO.x0 - 0.06, yP(H / 2), (BANO.z0 + BANO.z1) / 2], s: [0.12, H, BANO.z1 - BANO.z0] },
    ...paredConHuecos(BANO.x1 - BANO.x0 + 0.12, H, [{ u0: -1.25, u1: -0.45, y0: 0, y1: 2.05 }]).map((b) => ({
      p: [(BANO.x0 + BANO.x1 - 0.12) / 2 + b.u, yP((b.y0 + b.y1) / 2), BANO.z1 + 0.06] as Vec3,
      s: [b.w, b.y1 - b.y0, 0.12] as Vec3,
    })),
    { p: [-0.7, yP(H / 2), -2.4], s: [0.12, H, 4.8] },
    { p: [-2.3, yP(H / 2), 0.0], s: [3.2, H, 0.12] },
  ];

  // Techo a dos aguas, cumbrera a lo largo de z.
  const alero = 4.5;
  const cumbre = ALTURA_PARED + 1.85;
  const pendiente = Math.atan2(cumbre - ALTURA_PARED, alero);
  const largoFaldon = Math.hypot(alero, cumbre - ALTURA_PARED) + 0.05;
  const hastial = useMemo(() => {
    const f = new THREE.Shape();
    f.moveTo(-4, 0);
    f.lineTo(4, 0);
    f.lineTo(0, 1.7);
    f.closePath();
    return new THREE.ExtrudeGeometry(f, { depth: 0.2, bevelEnabled: false });
  }, []);

  const rejas = useMemo(() => {
    const r: Caja[] = [];
    for (let x = -3.9; x <= 3.9; x += 0.22) {
      if (x > -2.9 && x < -1.5) continue;
      r.push({ p: [x, 0.15 + 0.55, 7.75], s: [0.04, 1.1, 0.04] });
    }
    r.push({ p: [-3.3, 0.15 + 1.08, 7.75], s: [1.3, 0.06, 0.06] });
    r.push({ p: [1.65, 0.15 + 1.08, 7.75], s: [4.7, 0.06, 0.06] });
    return r;
  }, []);

  return (
    <group visible={!oculta}>
      {/* Platea y escalón */}
      <mesh position={[0, PISO / 2, 0]} material={m.zocalo} receiveShadow castShadow>
        <boxGeometry args={[8.2, PISO, 10.2]} />
      </mesh>
      <mesh position={[0, PISO + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.piso} receiveShadow>
        <planeGeometry args={[7.6, 9.6]} />
      </mesh>
      <Cajas cajas={exteriores} material={m.fachada} />
      <Cajas cajas={tabiques} material={m.interior} />

      {/* Puerta, ventanas con persianas abiertas */}
      <mesh position={[-2.2, yP(1.07), 4.93]} material={m.madera} castShadow>
        <boxGeometry args={[1.0, 2.15, 0.08]} />
      </mesh>
      {[
        [-0.2, 1.4],
        [2.2, 1.6],
      ].map(([u, w], i) => (
        <group key={i} position={[u, yP(1.55), 4.95]}>
          <mesh material={m.vidrio}>
            <boxGeometry args={[w, 1.3, 0.04]} />
          </mesh>
          <mesh material={m.marco} position={[0, -0.7, 0.08]} castShadow>
            <boxGeometry args={[w + 0.25, 0.08, 0.22]} />
          </mesh>
          {[-1, 1].map((l) => (
            <mesh key={l} material={m.persiana} position={[l * (w / 2 + w / 4 + 0.05), 0, 0.12]} castShadow>
              <boxGeometry args={[w / 2, 1.34, 0.05]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Muebles visibles en el corte */}
      <mesh position={[-2.6, yP(0.4), 3.4]} material={m.sillon} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.8, 0.9]} />
      </mesh>
      <mesh position={[-2.3, yP(0.38), -3.2]} material={m.cama} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.55, 2.0]} />
      </mesh>
      <mesh position={[1.5, yP(0.75), 2.2]} material={m.mesa} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.9]} />
      </mesh>
      {[
        [1.0, 1.6],
        [2.0, 1.6],
        [1.0, 2.8],
        [2.0, 2.8],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, yP(0.45), z]} material={m.madera} castShadow>
          <boxGeometry args={[0.42, 0.9, 0.42]} />
        </mesh>
      ))}

      <Bano frame={frame} tiempos={tiempos} azulejos={m.azulejos} salvia={m.salvia} damero={m.damero} />

      {/* Cielorraso + techo + tanque: se desvanecen juntos */}
      <group>
        <mesh position={[0, ALTURA_PARED + 0.05, 0]} material={m.cielorraso} castShadow={techoProyectaSombra} receiveShadow>
          <boxGeometry args={[8, 0.1, 10]} />
        </mesh>
        {[-1, 1].map((lado) => (
          <mesh
            key={lado}
            material={m.tejas}
            position={[lado * (alero / 2), (ALTURA_PARED + cumbre) / 2 + 0.1, 0]}
            rotation={[0, 0, -lado * pendiente]}
            castShadow={techoProyectaSombra}
            receiveShadow
          >
            <boxGeometry args={[largoFaldon, 0.14, 11]} />
          </mesh>
        ))}
        {[4.8, -5.0].map((z) => (
          <mesh key={z} geometry={hastial} material={m.hastial} position={[0, ALTURA_PARED + 0.1, z]} castShadow={techoProyectaSombra} />
        ))}
        {/* Tanque de agua sobre torrecita */}
        <group position={[-2.6, ALTURA_PARED + 1.5, -3.6]}>
          {[
            [-0.45, -0.45],
            [0.45, -0.45],
            [-0.45, 0.45],
            [0.45, 0.45],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.2, z]} material={m.hierro}>
              <boxGeometry args={[0.07, 1.2, 0.07]} />
            </mesh>
          ))}
          <mesh position={[0, 0.85, 0]} material={m.hierro}>
            <boxGeometry args={[1.1, 0.06, 1.1]} />
          </mesh>
          <mesh position={[0, 1.45, 0]} material={m.tanque} castShadow={techoProyectaSombra}>
            <cylinderGeometry args={[0.58, 0.52, 1.15, 24]} />
          </mesh>
          <mesh position={[0, 2.12, 0]} material={m.tanque}>
            <coneGeometry args={[0.6, 0.25, 24]} />
          </mesh>
        </group>
      </group>

      {/* Jardín: camino, reja, arbusto */}
      <mesh position={[-2.2, 0.17, 6.4]} material={m.zocalo} receiveShadow>
        <boxGeometry args={[1.2, 0.04, 2.8]} />
      </mesh>
      <Cajas cajas={rejas} material={m.reja} />
      <mesh position={[2.6, 0.75, 6.6]} castShadow>
        <icosahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial color="#5f9e50" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** Baño completo con la canilla protagonista. */
function Bano({
  frame,
  tiempos,
  azulejos,
  salvia,
  damero,
}: {
  frame: number;
  tiempos: TiemposCasa;
  azulejos: THREE.Texture;
  salvia: THREE.Material;
  damero: THREE.Material;
}) {
  const { x0, x1, z0, z1 } = BANO;
  const ancho = x1 - x0;
  const fondo = z1 - z0;
  const altoAzulejo = 1.5;

  const m = useMemo(() => {
    const ta = (rep: number) => {
      const t = azulejos.clone();
      t.repeat.set(rep, altoAzulejo / 1.2);
      t.offset.set(0, 0);
      t.needsUpdate = true;
      return mat({ map: t, roughness: 0.25 });
    };
    return {
      fondo: ta(ancho / 1.0),
      lateral: ta(fondo / 1.0),
      loza: mat({ color: "#fbfbf8", roughness: 0.18 }),
      cromo: mat({ color: "#e9eef2", roughness: 0.12, metalness: 1 }),
      marco: mat({ color: "#fbfaf6", roughness: 0.4 }),
      espejo: mat({ color: "#cfe0e8", roughness: 0.08, metalness: 0.85, emissive: "#9cc4d6", emissiveIntensity: 0.55 }),
      toalla: mat({ color: "#7fd1c3", roughness: 1 }),
      alfombra: mat({ color: "#f08a6c", roughness: 1 }),
      luz: mat({ color: "#fff6e0", emissive: "#ffe9b8", emissiveIntensity: 2.2 }),
      ventana: mat({ color: "#eaf6ff", emissive: "#d8efff", emissiveIntensity: 1.3 }),
      mampara: mat({ color: "#bfe6f2", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.28, depthWrite: false }),
      planta: mat({ color: "#4f9a58", roughness: 0.8, flatShading: true }),
      maceta: mat({ color: "#d9774f", roughness: 0.8 }),
      jabon: mat({ color: "#f5b3c8", roughness: 0.3 }),
      rojo: mat({ color: "#e0403a", roughness: 0.3 }),
      azul: mat({ color: "#2f7fe0", roughness: 0.3 }),
      gota: mat({ color: "#bfe9ff", roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.85 }),
      aire: mat({ color: "#ffffff", roughness: 1, transparent: true, opacity: 0.5, depthWrite: false }),
    };
  }, [azulejos, ancho, fondo]);

  const bacha = useMemo(() => {
    const perfil = [
      [0.001, -0.14], [0.12, -0.14], [0.24, -0.09], [0.3, 0.0], [0.31, 0.06],
      [0.29, 0.075], [0.25, 0.02], [0.18, -0.06], [0.08, -0.09], [0.001, -0.095],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(perfil, 40);
  }, []);

  const pico = useMemo(() => {
    const curva = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.11, 0),
      new THREE.Vector3(0, 0.24, 0),
      new THREE.Vector3(0, 0.23, 0.16),
      new THREE.Vector3(0, 0.15, 0.17),
    );
    return new THREE.TubeGeometry(curva, 32, 0.014, 14, false);
  }, []);

  // --- Animación de la canilla ---
  const giro = progreso(frame, tiempos.abreCanilla[0], tiempos.abreCanilla[1], easeInOutCubic) * (Math.PI * 0.75);
  // Después de abrir: la cañería "tose" (vibra) pero no sale agua.
  const tTos = progreso(frame, tiempos.abreCanilla[1], tiempos.abreCanilla[1] + 22);
  const vibracion = tTos > 0 && tTos < 1 ? Math.sin(frame * 2.6) * 0.004 * (1 - tTos) : 0;
  // Una única gota que se forma y cae.
  const [g0, g1] = tiempos.gota;
  const forma = progreso(frame, g0, g1 - 10, easeOutCubic);
  const caida = progreso(frame, g1 - 10, g1, (t) => t * t);
  const gotaVisible = frame >= g0 && frame < g1;
  const yGota = 0.15 - 0.012 - forma * 0.01 - caida * 0.17;
  // Bocanada de aire.
  const tAire = progreso(frame, tiempos.abreCanilla[1] - 2, tiempos.abreCanilla[1] + 14, easeOutCubic);

  const base: Vec3 = [2.35, PISO + 0.88, z0 + 0.1];

  return (
    <group>
      {/* Piso calcáreo */}
      <mesh position={[(x0 + x1) / 2, PISO + 0.01, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={damero} receiveShadow>
        <planeGeometry args={[ancho, fondo]} />
      </mesh>
      {/* Paredes pintadas por dentro (sobre los muros) */}
      <mesh position={[(x0 + x1) / 2, PISO + (ALTURA_PARED - PISO) / 2, z0 + 0.003]} material={salvia} receiveShadow>
        <planeGeometry args={[ancho, ALTURA_PARED - PISO]} />
      </mesh>
      <mesh position={[x1 - 0.003, PISO + (ALTURA_PARED - PISO) / 2, (z0 + z1) / 2]} rotation={[0, -Math.PI / 2, 0]} material={salvia} receiveShadow>
        <planeGeometry args={[fondo, ALTURA_PARED - PISO]} />
      </mesh>
      <mesh position={[x0 + 0.003, PISO + (ALTURA_PARED - PISO) / 2, (z0 + z1) / 2]} rotation={[0, Math.PI / 2, 0]} material={salvia} receiveShadow>
        <planeGeometry args={[fondo, ALTURA_PARED - PISO]} />
      </mesh>
      {/* Azulejos hasta 1,5 m */}
      <mesh position={[(x0 + x1) / 2, PISO + altoAzulejo / 2, z0 + 0.006]} material={m.fondo} receiveShadow>
        <planeGeometry args={[ancho, altoAzulejo]} />
      </mesh>
      <mesh position={[x1 - 0.006, PISO + altoAzulejo / 2, (z0 + z1) / 2]} rotation={[0, -Math.PI / 2, 0]} material={m.lateral} receiveShadow>
        <planeGeometry args={[fondo, altoAzulejo]} />
      </mesh>
      <mesh position={[x0 + 0.006, PISO + altoAzulejo / 2, (z0 + z1) / 2]} rotation={[0, Math.PI / 2, 0]} material={m.lateral} receiveShadow>
        <planeGeometry args={[fondo, altoAzulejo]} />
      </mesh>

      {/* Ventanita esmerilada y aplique de luz */}
      <mesh position={[3.35, PISO + 2.15, z0 + 0.01]} material={m.ventana}>
        <planeGeometry args={[0.6, 0.45]} />
      </mesh>
      <mesh position={[2.35, PISO + 2.05, z0 + 0.06]} material={m.luz}>
        <boxGeometry args={[0.5, 0.06, 0.08]} />
      </mesh>
      <pointLight position={[2.35, PISO + 2.3, z0 + 1.2]} color="#ffe6c4" intensity={5} distance={5.5} decay={2} />

      {/* Espejo */}
      <mesh position={[2.35, PISO + 1.55, z0 + 0.02]} material={m.marco}>
        <boxGeometry args={[0.7, 0.9, 0.03]} />
      </mesh>
      <mesh position={[2.35, PISO + 1.55, z0 + 0.04]} material={m.espejo}>
        <planeGeometry args={[0.62, 0.82]} />
      </mesh>

      {/* Bacha de pie */}
      <mesh position={[2.35, PISO + 0.33, z0 + 0.28]} material={m.loza} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.66, 24]} />
      </mesh>
      <mesh geometry={bacha} position={[2.35, PISO + 0.79, z0 + 0.32]} scale={[1, 1, 0.78]} material={m.loza} castShadow receiveShadow />
      <mesh position={[2.35, PISO + 0.855, z0 + 0.08]} material={m.loza} castShadow>
        <boxGeometry args={[0.56, 0.05, 0.14]} />
      </mesh>
      {/* Jabonera */}
      <mesh position={[2.6, PISO + 0.93, z0 + 0.08]} material={m.jabon} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.11, 16]} />
      </mesh>

      {/* Canilla */}
      <group position={[base[0] + vibracion, base[1], base[2]]}>
        <mesh material={m.cromo} position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.036, 0.04, 0.016, 24]} />
        </mesh>
        <mesh material={m.cromo} position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.024, 0.11, 20]} />
        </mesh>
        <mesh geometry={pico} material={m.cromo} castShadow />
        <mesh material={m.cromo} position={[0, 0.142, 0.17]}>
          <cylinderGeometry args={[0.017, 0.017, 0.022, 16]} />
        </mesh>
        {[
          { x: -0.1, color: m.rojo, rot: 0 },
          { x: 0.1, color: m.azul, rot: -giro },
        ].map((h) => (
          <group key={h.x} position={[h.x, 0, 0]}>
            <mesh material={m.cromo} position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.014, 0.018, 0.06, 16]} />
            </mesh>
            <group position={[0, 0.065, 0]} rotation={[0, h.rot, 0]}>
              {[0, 1].map((k) => (
                <mesh key={k} material={m.cromo} rotation={[0, (k * Math.PI) / 2 + Math.PI / 4, 0]} castShadow>
                  <boxGeometry args={[0.09, 0.014, 0.016]} />
                </mesh>
              ))}
              <mesh material={m.cromo} position={[0, 0.01, 0]}>
                <sphereGeometry args={[0.018, 16, 12]} />
              </mesh>
              <mesh material={h.color} position={[0, 0.026, 0]}>
                <cylinderGeometry args={[0.009, 0.009, 0.004, 12]} />
              </mesh>
            </group>
          </group>
        ))}
        {/* La gota solitaria */}
        <mesh
          material={m.gota}
          visible={gotaVisible}
          position={[0, yGota, 0.17]}
          scale={[0.6 + forma * 0.4, 0.7 + forma * 0.5 + caida * 0.4, 0.6 + forma * 0.4]}
        >
          <sphereGeometry args={[0.016, 16, 12]} />
        </mesh>
        {/* Bocanada de aire: la cañería está vacía */}
        {tAire > 0 && tAire < 1
          ? [0, 1, 2, 3, 4, 5].map((k) => {
              const a = (k / 6) * Math.PI * 2;
              const r = 0.012 + tAire * 0.05;
              return (
                <mesh
                  key={k}
                  material={m.aire}
                  position={[Math.cos(a) * r, 0.13 - tAire * 0.05, 0.17 + Math.sin(a) * r]}
                  scale={1 - tAire}
                >
                  <sphereGeometry args={[0.007, 8, 6]} />
                </mesh>
              );
            })
          : null}
      </group>

      {/* Inodoro */}
      <group position={[1.45, PISO, z0]}>
        <mesh material={m.loza} position={[0, 0.2, 0.42]} scale={[1, 1, 1.3]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.13, 0.4, 24]} />
        </mesh>
        <mesh material={m.loza} position={[0, 0.42, 0.44]} scale={[1, 1, 1.32]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
        </mesh>
        <mesh material={m.loza} position={[0, 0.62, 0.11]} castShadow>
          <boxGeometry args={[0.42, 0.4, 0.18]} />
        </mesh>
        <mesh material={m.cromo} position={[0.12, 0.84, 0.11]}>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
        </mesh>
      </group>

      {/* Toallero con toalla */}
      <mesh material={m.cromo} position={[1.85, PISO + 1.3, z0 + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.008, 8, 24]} />
      </mesh>
      <mesh material={m.toalla} position={[1.85, PISO + 1.08, z0 + 0.06]} castShadow>
        <boxGeometry args={[0.22, 0.42, 0.05]} />
      </mesh>

      {/* Ducha con mampara */}
      <mesh material={m.loza} position={[3.4, PISO + 0.03, z0 + 0.5]} receiveShadow>
        <boxGeometry args={[0.8, 0.06, 1.0]} />
      </mesh>
      <mesh material={m.mampara} position={[2.99, PISO + 1.0, z0 + 0.5]}>
        <boxGeometry args={[0.02, 1.9, 1.0]} />
      </mesh>
      <mesh material={m.cromo} position={[3.4, PISO + 1.0, z0 + 0.04]}>
        <cylinderGeometry args={[0.012, 0.012, 1.9, 12]} />
      </mesh>
      <mesh material={m.cromo} position={[3.4, PISO + 1.95, z0 + 0.12]} rotation={[Math.PI / 2.6, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.05, 0.03, 24]} />
      </mesh>

      {/* Estante con planta */}
      <mesh material={m.loza} position={[2.85, PISO + 1.2, z0 + 0.08]}>
        <boxGeometry args={[0.3, 0.025, 0.14]} />
      </mesh>
      <mesh material={m.maceta} position={[2.85, PISO + 1.26, z0 + 0.08]}>
        <cylinderGeometry args={[0.045, 0.035, 0.09, 16]} />
      </mesh>
      <mesh material={m.planta} position={[2.85, PISO + 1.36, z0 + 0.08]}>
        <icosahedronGeometry args={[0.08, 0]} />
      </mesh>

      {/* Alfombra */}
      <mesh material={m.alfombra} position={[2.35, PISO + 0.02, z0 + 0.95]} receiveShadow>
        <boxGeometry args={[0.7, 0.015, 0.45]} />
      </mesh>
    </group>
  );
}
