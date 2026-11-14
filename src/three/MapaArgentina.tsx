import { useMemo } from "react";
import * as THREE from "three";
import { clamp01, crearAzar, easeInOutCubic, easeOutBack, easeOutCubic, progreso, type Vec3 } from "../lib/anim";
import { texturaSol, texturaTexto } from "./texturas";

/**
 * Mapa tridimensional de la República Argentina, estilizado: contorno
 * continental, Tierra del Fuego e Islas Malvinas, cordillera, ciudades en
 * miniatura con su planta y su red, línea de tiempo, contratos y símbolos
 * de empresas. Es una representación visual, no un mapa cartográfico.
 */

export const ESCALA_MAPA = 2.4;
/** Convierte longitud/latitud en coordenadas de la escena (norte hacia -z). */
export function proyectar(lon: number, lat: number): [number, number] {
  return [(lon + 63.5) * ESCALA_MAPA, -(lat + 38.5) * ESCALA_MAPA];
}
const ALTO_MAPA = 1.6;

// Contorno aproximado (lon, lat), simplificado para una lectura clara.
const CONTINENTE: [number, number][] = [
  [-67.2, -22.8], [-66.2, -21.9], [-65.0, -22.1], [-64.3, -22.8], [-63.9, -22.0], [-62.8, -22.0],
  [-61.0, -23.3], [-59.5, -24.4], [-58.2, -25.1], [-57.6, -25.4], [-58.6, -27.3], [-56.4, -27.5],
  [-55.6, -27.3], [-54.6, -25.6], [-53.7, -26.2], [-53.8, -27.1], [-55.6, -28.2], [-57.6, -30.2],
  [-58.1, -32.4], [-58.4, -33.9], [-58.4, -34.6], [-57.3, -35.3], [-56.7, -36.3], [-57.5, -38.0],
  [-58.7, -38.6], [-61.0, -38.95], [-62.3, -38.9], [-62.3, -39.9], [-62.1, -40.6], [-64.9, -40.8],
  [-65.1, -41.2], [-64.0, -42.2], [-63.6, -42.6], [-64.5, -42.9], [-65.0, -43.6], [-65.3, -44.5],
  [-66.5, -45.0], [-67.6, -46.0], [-67.4, -46.6], [-65.9, -47.8], [-67.6, -49.3], [-68.4, -50.1],
  [-69.0, -50.9], [-69.2, -51.6], [-68.4, -52.3], [-69.6, -52.2], [-71.9, -52.0], [-72.3, -51.0],
  [-73.2, -50.5], [-73.0, -49.3], [-72.6, -48.5], [-72.0, -47.0], [-71.8, -46.0], [-71.8, -45.0],
  [-71.5, -44.0], [-71.8, -43.0], [-71.9, -42.0], [-71.7, -41.0], [-71.6, -40.0], [-71.1, -39.0],
  [-71.0, -38.0], [-70.6, -37.0], [-70.3, -36.0], [-69.8, -35.0], [-70.0, -34.0], [-70.0, -33.0],
  [-70.2, -31.5], [-69.9, -30.0], [-69.4, -29.0], [-68.8, -28.0], [-68.3, -27.0], [-68.5, -26.0],
  [-68.4, -25.0], [-68.2, -24.0], [-67.3, -24.0], [-67.0, -23.0],
];
const TIERRA_DEL_FUEGO: [number, number][] = [
  [-68.6, -52.6], [-67.9, -53.0], [-67.6, -53.8], [-66.5, -54.5], [-65.2, -54.7],
  [-66.5, -54.95], [-68.3, -54.85], [-68.6, -54.9],
];
const GRAN_MALVINA: [number, number][] = [
  [-61.3, -51.3], [-60.2, -51.25], [-59.6, -51.6], [-59.9, -52.2], [-60.9, -52.1], [-61.4, -51.8],
];
const SOLEDAD: [number, number][] = [
  [-59.4, -51.4], [-58.4, -51.3], [-57.7, -51.6], [-58.3, -52.2], [-59.2, -52.3], [-59.5, -51.9],
];

export interface CiudadMapa {
  nombre: string;
  lon: number;
  lat: number;
  tamano: number;
  /** Algunas muestran símbolo de empresa privada: experiencias diversas, no todas iguales. */
  empresa?: boolean;
}

export const CIUDADES: CiudadMapa[] = [
  { nombre: "Buenos Aires", lon: -58.45, lat: -34.62, tamano: 2.2, empresa: true },
  { nombre: "Córdoba", lon: -64.18, lat: -31.42, tamano: 1.5, empresa: true },
  { nombre: "Rosario", lon: -60.65, lat: -32.95, tamano: 1.4 },
  { nombre: "Mendoza", lon: -68.84, lat: -32.89, tamano: 1.3, empresa: true },
  { nombre: "Tucumán", lon: -65.2, lat: -26.82, tamano: 1.2 },
  { nombre: "Salta", lon: -65.41, lat: -24.79, tamano: 1.1, empresa: true },
  { nombre: "Santa Fe", lon: -60.7, lat: -31.63, tamano: 1.0, empresa: true },
  { nombre: "Mar del Plata", lon: -57.56, lat: -38.0, tamano: 1.1 },
  { nombre: "Bahía Blanca", lon: -62.27, lat: -38.72, tamano: 0.9 },
  { nombre: "Neuquén", lon: -68.06, lat: -38.95, tamano: 1.0 },
  { nombre: "Resistencia", lon: -58.98, lat: -27.45, tamano: 0.9 },
  { nombre: "Posadas", lon: -55.9, lat: -27.37, tamano: 0.9 },
  { nombre: "Corrientes", lon: -58.83, lat: -27.47, tamano: 0.8, empresa: true },
  { nombre: "San Juan", lon: -68.53, lat: -31.54, tamano: 0.9 },
  { nombre: "Santiago del Estero", lon: -64.26, lat: -27.8, tamano: 0.9, empresa: true },
  { nombre: "San Luis", lon: -66.34, lat: -33.3, tamano: 0.7 },
  { nombre: "Santa Rosa", lon: -64.29, lat: -36.62, tamano: 0.7 },
  { nombre: "Viedma", lon: -62.99, lat: -40.81, tamano: 0.6 },
  { nombre: "Rawson", lon: -65.1, lat: -43.3, tamano: 0.6 },
  { nombre: "Comodoro Rivadavia", lon: -67.5, lat: -45.86, tamano: 0.8 },
  { nombre: "Río Gallegos", lon: -69.22, lat: -51.62, tamano: 0.6 },
  { nombre: "Ushuaia", lon: -68.3, lat: -54.75, tamano: 0.6 },
  { nombre: "Jujuy", lon: -65.3, lat: -24.19, tamano: 0.7 },
  { nombre: "Formosa", lon: -58.18, lat: -26.18, tamano: 0.7 },
  { nombre: "Catamarca", lon: -65.78, lat: -28.47, tamano: 0.6 },
  { nombre: "La Rioja", lon: -66.85, lat: -29.41, tamano: 0.6 },
  { nombre: "Paraná", lon: -60.52, lat: -31.73, tamano: 0.8 },
];

/** Posición (x, z) de una ciudad del mapa por nombre. */
export function posCiudad(nombre: string): Vec3 {
  const c = CIUDADES.find((x) => x.nombre === nombre)!;
  const [x, z] = proyectar(c.lon, c.lat);
  return [x, ALTO_MAPA, z];
}

function forma(puntos: [number, number][]) {
  const s = new THREE.Shape();
  puntos.forEach(([lon, lat], i) => {
    const [x, z] = proyectar(lon, lat);
    if (i === 0) s.moveTo(x, -z);
    else s.lineTo(x, -z);
  });
  s.closePath();
  return s;
}

export interface EstadoMapa {
  /** 0..1 aparición de ciudades, plantas y redes. */
  ciudades: number;
  /** 0..1 línea de tiempo. */
  lineaTiempo: number;
  /** 0..1 contratos que caen sobre el mapa. */
  contratos: number;
  /** 0..1 símbolos de empresas. */
  empresas: number;
  /** 0..1 redes que titilan (conflictos), solo en algunas ciudades. */
  tension: number;
  /** 0..1 carteles con las promesas (inversiones, servicio mejor, futuro diferente). */
  promesas?: number;
  /** 0..1 los carteles giran y muestran «?». */
  pregunta?: number;
  /** 0..1 líneas de luz que unen las ciudades. */
  luzRed?: number;
  /** 0..1 el país se ilumina en celeste y blanco (soberanía). */
  soberania?: number;
  /** 0..1 trabajadores junto a las ciudades. */
  trabajadores?: number;
  /** 0..1 ocultar línea de tiempo, contratos y empresas (otra secuencia). */
  limpiar?: number;
}

const PROMESAS = ["INVERSIONES", "SERVICIO MEJOR", "FUTURO DIFERENTE"];
const POS_CARTELES: Vec3[] = [
  [1, ALTO_MAPA, -30],
  [3, ALTO_MAPA, -20],
  [1, ALTO_MAPA, -10],
];

export function MapaArgentina({ frame, estado }: { frame: number; estado: EstadoMapa }) {
  const r = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(
      [forma(CONTINENTE), forma(TIERRA_DEL_FUEGO), forma(GRAN_MALVINA), forma(SOLEDAD)],
      { depth: ALTO_MAPA, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 2 },
    );
    const azar = crearAzar(5);
    // Cordillera: conos bajos a lo largo del límite oeste.
    const cerros: { p: Vec3; h: number; rad: number }[] = [];
    for (let lat = -23; lat > -51; lat -= 0.55) {
      const borde = CONTINENTE.filter(([, la]) => Math.abs(la - lat) < 1.2).reduce((min, [lo]) => Math.min(min, lo), 0);
      const [x, z] = proyectar(borde + 0.9 + azar.entre(0, 0.6), lat + azar.entre(-0.2, 0.2));
      const h = (lat > -36 ? 2.6 : 1.6) * azar.entre(0.7, 1.2);
      cerros.push({ p: [x, ALTO_MAPA, z], h, rad: azar.entre(0.9, 1.5) });
    }
    const contrato = texturaTexto("CONTRATO\nDE CONCESIÓN\n— — — — —\n— — — —", {
      ancho: 320, alto: 420, tamano: 40, fondo: "#fbf8f0", color: "#2b2b2b", borde: "#c9b991",
    });
    const etiquetas = new Map<string, THREE.Texture>();
    const etiqueta = (t: string, color = "#ffffff", fondo: string | null = null, tamano = 64) => {
      const k = `${t}|${color}|${fondo}`;
      if (!etiquetas.has(k)) etiquetas.set(k, texturaTexto(t, { fondo, color, ancho: 512, alto: 128, tamano }));
      return etiquetas.get(k)!;
    };
    return {
      geo,
      cerros,
      tierra: new THREE.MeshStandardMaterial({ color: "#dfe9c8", roughness: 0.85 }),
      costa: new THREE.MeshStandardMaterial({ color: "#c8b48c", roughness: 0.9 }),
      cerro: new THREE.MeshStandardMaterial({ color: "#b7a789", roughness: 0.9, flatShading: true }),
      nieve: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7, flatShading: true }),
      mar: new THREE.MeshStandardMaterial({ color: "#2a6a96", roughness: 0.3, metalness: 0.1 }),
      casa: new THREE.MeshStandardMaterial({ color: "#f2e3c6", roughness: 0.8 }),
      teja: new THREE.MeshStandardMaterial({ color: "#c4643a", roughness: 0.7 }),
      planta: new THREE.MeshStandardMaterial({ color: "#5bc0eb", emissive: "#1aa3ff", emissiveIntensity: 0.4, roughness: 0.3 }),
      red: new THREE.MeshBasicMaterial({ color: "#6fd6ff", toneMapped: false, transparent: true }),
      redTension: new THREE.MeshBasicMaterial({ color: "#6fd6ff", toneMapped: false, transparent: true }),
      empresa: new THREE.MeshStandardMaterial({ color: "#24384c", roughness: 0.1, metalness: 0.75 }),
      oro: new THREE.MeshStandardMaterial({ color: "#f6c344", metalness: 0.8, roughness: 0.25, emissive: "#a86f00", emissiveIntensity: 0.5 }),
      contrato: new THREE.MeshStandardMaterial({ map: contrato, roughness: 0.9, side: THREE.DoubleSide }),
      sello: new THREE.MeshBasicMaterial({ color: "#d32f2f", toneMapped: false }),
      regla: new THREE.MeshStandardMaterial({ color: "#f4f1e8", roughness: 0.6 }),
      noventa: new THREE.MeshStandardMaterial({ color: "#ff8a3d", emissive: "#ff6a00", emissiveIntensity: 0.6, roughness: 0.4 }),
      etiqueta,
      cartel: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 }),
      poste: new THREE.MeshStandardMaterial({ color: "#3b4148", roughness: 0.5, metalness: 0.5 }),
      frentes: PROMESAS.map((p) => new THREE.MeshBasicMaterial({ map: texturaTexto(p, { ancho: 768, alto: 256, tamano: 84, color: "#0f2236", fondo: "#ffffff", borde: "#74acdf" }), toneMapped: false })),
      dorso: new THREE.MeshBasicMaterial({ map: texturaTexto("?", { ancho: 768, alto: 256, tamano: 210, color: "#ffffff", fondo: "#e0403a" }), toneMapped: false }),
      arcos: (() => {
        // Cadena de ciudades vecinas: cada una se une con la más cercana ya conectada.
        const pts = CIUDADES.map((c) => proyectar(c.lon, c.lat));
        const unidos = [0];
        const tubos: THREE.TubeGeometry[] = [];
        while (unidos.length < pts.length) {
          let mejor = [-1, -1, Infinity];
          for (let i = 0; i < pts.length; i++) {
            if (unidos.includes(i)) continue;
            for (const j of unidos) {
              const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
              if (d < mejor[2]) mejor = [i, j, d];
            }
          }
          const [i, j, d] = mejor;
          unidos.push(i);
          const a = new THREE.Vector3(pts[j][0], ALTO_MAPA + 0.3, pts[j][1]);
          const b = new THREE.Vector3(pts[i][0], ALTO_MAPA + 0.3, pts[i][1]);
          const medio = a.clone().add(b).multiplyScalar(0.5).setY(ALTO_MAPA + 0.6 + d * 0.22);
          tubos.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, medio, b), 32, 0.16, 6, false));
        }
        return tubos;
      })(),
      luz: new THREE.MeshBasicMaterial({ color: "#7fdcff", toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      sol: new THREE.SpriteMaterial({ map: texturaSol(), toneMapped: false, transparent: true, depthWrite: false }),
      casas: CIUDADES.map((c, i) => {
        const az = crearAzar(100 + i);
        const n = Math.round(5 + c.tamano * 5);
        return Array.from({ length: n }, () => {
          const a = az.entre(0, Math.PI * 2);
          const d = Math.sqrt(az.n()) * c.tamano * 0.9;
          return { dx: Math.cos(a) * d, dz: Math.sin(a) * d, h: az.entre(0.25, 0.45) * (c.tamano > 1.4 && az.n() < 0.3 ? 2.4 : 1) };
        });
      }),
      anillos: CIUDADES.map((c) => new THREE.TorusGeometry(c.tamano * 1.25, 0.07, 6, 48)),
    };
  }, []);

  const pasoCiudad = (i: number) => easeOutBack(progreso(estado.ciudades, i / CIUDADES.length * 0.7, i / CIUDADES.length * 0.7 + 0.3));
  r.redTension.opacity = 1 - estado.tension * (0.45 + 0.45 * Math.sin(frame * 0.5));

  const sob = estado.soberania ?? 0;
  const limpiar = estado.limpiar ?? 0;
  r.tierra.color.set("#dfe9c8").lerp(new THREE.Color("#8cc4ef"), sob * 0.85);
  r.tierra.emissive.set("#74acdf");
  r.tierra.emissiveIntensity = sob * (0.25 + 0.1 * Math.sin(frame * 0.15));
  r.luz.opacity = 0.9;
  r.arcos.forEach((g, i) => {
    const p = progreso(estado.luzRed ?? 0, (i / r.arcos.length) * 0.75, (i / r.arcos.length) * 0.75 + 0.25);
    const total = g.index ? g.index.count : 0;
    g.setDrawRange(0, Math.floor((total * p) / 36) * 36);
  });

  // Línea de tiempo sobre el Atlántico Sur.
  const xLinea = 22;
  const zIni = -6;
  const zFin = 40;
  const anio = (a: number) => zIni + ((a - 1980) / 30) * (zFin - zIni);
  const lt = estado.lineaTiempo * (1 - limpiar);
  const resalte = easeInOutCubic(progreso(lt, 0.35, 0.8));

  return (
    <group>
      {/* Mar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} material={r.mar} receiveShadow>
        <planeGeometry args={[600, 600]} />
      </mesh>
      {/* Territorio */}
      <mesh geometry={r.geo} rotation={[-Math.PI / 2, 0, 0]} material={[r.tierra, r.costa]} castShadow receiveShadow />
      {r.cerros.map((c, i) => (
        <group key={i} position={c.p}>
          <mesh material={r.cerro} position={[0, c.h / 2, 0]} castShadow>
            <coneGeometry args={[c.rad, c.h, 5]} />
          </mesh>
          {c.h > 2 ? (
            <mesh material={r.nieve} position={[0, c.h * 0.86, 0]}>
              <coneGeometry args={[c.rad * 0.3, c.h * 0.28, 5]} />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* Ciudades, plantas y redes */}
      {CIUDADES.map((c, i) => {
        const s = pasoCiudad(i);
        if (s <= 0.001) return null;
        const [x, z] = proyectar(c.lon, c.lat);
        const conflicto = c.empresa && i % 2 === 1;
        return (
          <group key={c.nombre} position={[x, ALTO_MAPA, z]} scale={s}>
            {r.casas[i].map((h, k) => (
              <group key={k} position={[h.dx, 0, h.dz]}>
                <mesh material={r.casa} position={[0, h.h / 2, 0]} castShadow>
                  <boxGeometry args={[0.32, h.h, 0.32]} />
                </mesh>
                <mesh material={r.teja} position={[0, h.h + 0.08, 0]}>
                  <coneGeometry args={[0.26, 0.18, 4]} />
                </mesh>
              </group>
            ))}
            <mesh material={r.planta} position={[c.tamano * 1.25 + 0.3, 0.2, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
            </mesh>
            <mesh geometry={r.anillos[i]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} material={conflicto ? r.redTension : r.red} />
          </group>
        );
      })}

      {/* Red de luz entre ciudades */}
      {(estado.luzRed ?? 0) > 0 ? r.arcos.map((g, i) => <mesh key={i} geometry={g} material={r.luz} />) : null}

      {/* Carteles con las promesas, que giran para mostrar la pregunta */}
      {PROMESAS.map((_, i) => {
        const s = easeOutBack(progreso(estado.promesas ?? 0, i * 0.3, i * 0.3 + 0.25)) * (1 - limpiar);
        if (s <= 0.001) return null;
        const giro = easeInOutCubic(progreso(estado.pregunta ?? 0, i * 0.12, i * 0.12 + 0.6)) * Math.PI;
        return (
          <group key={i} position={POS_CARTELES[i]} scale={s}>
            {[-3.2, 3.2].map((x) => (
              <mesh key={x} position={[x, 3, 0]} material={r.poste}>
                <cylinderGeometry args={[0.18, 0.18, 6, 10]} />
              </mesh>
            ))}
            <group position={[0, 6.6, 0]} rotation={[0, giro, 0]}>
              <mesh material={r.cartel}>
                <boxGeometry args={[9.4, 3.2, 0.3]} />
              </mesh>
              <mesh material={r.frentes[i]} position={[0, 0, 0.16]}>
                <planeGeometry args={[9.2, 3.0]} />
              </mesh>
              <mesh material={r.dorso} position={[0, 0, -0.16]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[9.2, 3.0]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Sol de Mayo sobre el país iluminado */}
      {sob > 0.01 ? (
        <sprite material={r.sol} position={[2, 26 + 6 * sob, -6]} scale={[18 * sob, 18 * sob, 1]} />
      ) : null}

      {/* Símbolos de empresas privadas (solo en algunas ciudades) */}
      {CIUDADES.filter((c) => c.empresa).map((c, i) => {
        const s = easeOutBack(progreso(estado.empresas, i * 0.09, i * 0.09 + 0.35)) * (1 - limpiar);
        if (s <= 0.001) return null;
        const [x, z] = proyectar(c.lon, c.lat);
        return (
          <group key={c.nombre} position={[x - c.tamano * 1.3 - 0.4, ALTO_MAPA, z - 0.6]} scale={s}>
            <mesh material={r.empresa} position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[0.9, 2.8, 0.9]} />
            </mesh>
            <group position={[0, 3.6 + Math.sin(frame * 0.12 + i) * 0.15, 0]} rotation={[Math.PI / 2, 0, frame * 0.05]}>
              <mesh material={r.oro}>
                <cylinderGeometry args={[0.55, 0.55, 0.12, 24]} />
              </mesh>
            </group>
            <sprite position={[0, 3.6 + Math.sin(frame * 0.12 + i) * 0.15, 0.1]} scale={[0.8, 0.8, 1]}>
              <spriteMaterial map={r.etiqueta("$", "#8a5a00", null, 110)} toneMapped={false} depthTest={false} />
            </sprite>
          </group>
        );
      })}

      {/* Contratos que caen y se apoyan sobre el mapa */}
      {["Buenos Aires", "Córdoba", "Mendoza", "Salta", "Santa Fe", "Corrientes"].map((n, i) => {
        const t = progreso(estado.contratos, i * 0.1, i * 0.1 + 0.45);
        if (t <= 0 || limpiar > 0.5) return null;
        const [x, , z] = posCiudad(n);
        const caida = easeOutCubic(t);
        const y = ALTO_MAPA + 0.2 + (1 - caida) * 22;
        const sello = progreso(estado.contratos, i * 0.1 + 0.45, i * 0.1 + 0.55);
        return (
          <group key={n} position={[x + 2.6, y, z + 1.6]} rotation={[-Math.PI / 2 + (1 - caida) * 0.6, 0, (1 - caida) * 1.4 - 0.25]}>
            <mesh material={r.contrato} castShadow>
              <planeGeometry args={[2.4, 3.15]} />
            </mesh>
            {sello > 0 ? (
              <mesh material={r.sello} position={[0.55, -0.9, 0.02]} scale={easeOutBack(sello)}>
                <ringGeometry args={[0.28, 0.38, 24]} />
              </mesh>
            ) : null}
          </group>
        );
      })}

      {/* Línea de tiempo */}
      {lt > 0 ? (
        <group scale={[1, 1, 1]}>
          <mesh position={[xLinea, 1.2, (zIni + zFin) / 2]} material={r.regla} scale={[1, 1, Math.max(0.001, easeOutCubic(progreso(lt, 0, 0.3)))]}>
            <boxGeometry args={[0.5, 0.4, zFin - zIni]} />
          </mesh>
          {[1980, 1985, 1990, 1995, 2000, 2005, 2010].map((a, i) => {
            const s = easeOutBack(progreso(lt, 0.1 + i * 0.03, 0.25 + i * 0.03));
            if (s <= 0.001) return null;
            return (
              <group key={a} position={[xLinea, 1.4, anio(a)]}>
                <mesh material={r.regla} scale={s}>
                  <boxGeometry args={[1.4, 0.5, 0.18]} />
                </mesh>
                <sprite position={[3.6, 0.6, 0]} scale={[4.6 * s, 1.15 * s, 1]}>
                  <spriteMaterial map={r.etiqueta(String(a))} toneMapped={false} />
                </sprite>
              </group>
            );
          })}
          {resalte > 0 ? (
            <>
              <mesh
                position={[xLinea, 1.6, anio(1990) + ((anio(2000) - anio(1990)) * resalte) / 2]}
                material={r.noventa}
              >
                <boxGeometry args={[1.1, 0.7, Math.max(0.01, (anio(2000) - anio(1990)) * resalte)]} />
              </mesh>
              <sprite position={[xLinea - 7.5, 4, anio(1995)]} scale={[13 * resalte, 3.25 * resalte, 1]}>
                <spriteMaterial map={r.etiqueta("AÑOS 90", "#ffffff", "#ff7a1a", 84)} toneMapped={false} />
              </sprite>
            </>
          ) : null}
        </group>
      ) : null}
    </group>
  );
}

/** Opacidad 0..1 de la línea de tiempo según la posición en la escena (ayuda). */
export const visibleEntre = (t: number, a: number, b: number) => clamp01(Math.min((t - a) / 0.1, (b - t) / 0.1));
