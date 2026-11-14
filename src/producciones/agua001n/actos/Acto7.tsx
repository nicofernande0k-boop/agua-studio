import { useMemo } from "react";
import * as THREE from "three";
import { crearAzar, easeInOutCubic, progreso, type Vec3 } from "../../../lib/anim";
import { CASA_QUIETA } from "../../../three/Casa";
import { datosCiudad } from "../../../three/Ciudad";
import { POS_TORRE } from "../../../three/Edificios";
import { Fuente, POS_PUEBLO, Pueblo } from "../../../three/Narrada";
import { texturaSol, texturaTexto } from "../../../three/texturas";
import { OPCIONES, RED_LLENA } from "../../agua001/comun";
import { AMANECER, DORADO } from "../cielos";
import { K, Tomas, VistaCiudad, s } from "../comun";
import { VistaMapa } from "../VistaMapa";

/**
 * Acto 7 (1:39,9–2:06,6) — historia de lucha y soberanía.
 * Mapa con la red de luz → «no hablamos solamente de cañerías / de tarifas» →
 * hijos · barrios · pueblos · futuro (un corte por palabra) → «soberanía»:
 * el país se ilumina en celeste y blanco con el Sol de Mayo, y silencio.
 */

const [tx, , tz] = POS_TORRE;
const [px, , pz] = POS_PUEBLO;
const ciudad = { casa: CASA_QUIETA, red: { frente: RED_LLENA } };

const Historia: React.FC = () => (
  <VistaMapa
    camara={[K(0, [0, 150, 62], [0, 0, 2], 40), K(6.0, [18, 112, 72], [2, 0, 0], 40), K(12.0, [-6, 72, 42], [-4, 0, -6], 42)]}
    estado={(f) => {
      const retroceso = progreso(f, s(7.0), s(7.6)) * (1 - progreso(f, s(8.4), s(9.2)));
      return { ciudades: 1, lineaTiempo: 0, contratos: 0, empresas: 0, tension: retroceso, luzRed: progreso(f, s(0.5), s(6.5)), limpiar: 1 };
    }}
  />
);

const Canerias: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...ciudad, camara: [K(0, [-22, 5.6, 15.4], [0, -2.2, 13], 46), K(3.7, [12, 5.6, 15.4], [34, -2.2, 13], 46)], cielo: DORADO, rayosX: 1, red: { frente: RED_LLENA, brillo: 1.6 } })}
  />
);

/** Facturas que flotan sobre las casas y se disuelven en gotas. */
function FacturasDisuelven({ frame }: { frame: number }) {
  const r = useMemo(() => {
    const azar = crearAzar(3);
    const casas: Vec3[] = datosCiudad(OPCIONES)
      .lotes.filter((l) => l.tipo === "casa" && Math.hypot(l.x, l.z) < 34)
      .slice(0, 12)
      .map((l) => [l.x, 8 + azar.entre(0, 2), l.z]);
    return {
      casas,
      papel: new THREE.MeshBasicMaterial({
        map: texturaTexto("TARIFA\n$ — — —", { ancho: 256, alto: 320, tamano: 44, color: "#1d2433", fondo: "#ffffff", borde: "#d32f2f" }),
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
      gota: new THREE.MeshBasicMaterial({ color: "#7fdcff", transparent: true, toneMapped: false }),
    };
  }, []);
  const disuelve = progreso(frame, s(0.9), s(2.0), easeInOutCubic);
  r.papel.opacity = 1 - disuelve;
  r.gota.opacity = disuelve * (1 - progreso(frame, s(2.4), s(2.9)));
  return (
    <group>
      {r.casas.map((c, i) => (
        <group key={i} position={c}>
          <mesh material={r.papel} rotation={[0, frame * 0.02 + i, 0]} scale={3.2 * (1 - disuelve * 0.4)}>
            <planeGeometry args={[0.8, 1.0]} />
          </mesh>
          {disuelve > 0
            ? [0, 1, 2].map((k) => (
                <mesh key={k} material={r.gota} position={[(k - 1) * 0.6, -disuelve * 5 - k * 0.5, 0]}>
                  <sphereGeometry args={[0.28, 10, 8]} />
                </mesh>
              ))
            : null}
        </group>
      ))}
    </group>
  );
}

const Tarifas: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...ciudad, camara: [K(0, [-14, 22, 40], [0, 6, 0], 44), K(2.9, [-10, 20, 36], [0, 5, 0], 44)], cielo: DORADO })}
    extras={(f) => <FacturasDisuelven frame={f} />}
  />
);

const Hijos: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...ciudad, camara: [K(0, [tx + 3.6, 2.9, tz + 6.0], [tx, 2.2, tz], 50), K(1.3, [tx + 3.2, 2.8, tz + 5.4], [tx, 2.4, tz], 48)], cielo: DORADO })}
    extras={(f) => <Fuente frame={f + 60} flujo={1} />}
  />
);

const Barrios: React.FC = () => (
  <VistaCiudad
    estado={() => ({ ...ciudad, camara: [K(0, [-40, 26, 40], [-10, 0, 0], 42), K(1.4, [-34, 24, 34], [-6, 0, -2], 42)], cielo: DORADO })}
  />
);

const Pueblos: React.FC = () => (
  <VistaCiudad
    sinEspeciales
    estado={() => ({ ...ciudad, camara: [K(0, [px - 6, 6, pz + 26], [px + 12, 2.5, pz + 4], 44), K(1.4, [px - 3, 5.5, pz + 24], [px + 14, 2.5, pz + 4], 44)], cielo: DORADO, red: null })}
    extras={(f) => <Pueblo frame={f} conAgua={1} />}
  />
);

/** Sol bajo en el horizonte (no lo afecta la niebla). */
function SolHorizonte() {
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: texturaSol(), transparent: true, depthWrite: false, fog: false, toneMapped: false }), []);
  return <sprite material={mat} position={[260, 30, -40]} scale={[90, 90, 1]} />;
}

const Futuro: React.FC = () => (
  <VistaCiudad
    estado={() => ({
      ...ciudad,
      camara: [K(0, [10, 8, 30], [120, 12, -20], 46), K(1.5, [12, 14, 32], [120, 18, -20], 46)],
      cielo: { ...AMANECER, direccion: [80, 14, -20] },
    })}
    extras={() => <SolHorizonte />}
  />
);

const Soberania: React.FC = () => (
  <VistaMapa
    camara={[K(0, [0, 128, 72], [0, 0, 0], 40), K(2.5, [2, 104, 58], [1, 2, -2], 40)]}
    estado={(f) => ({ ciudades: 1, lineaTiempo: 0, contratos: 0, empresas: 0, tension: 0, luzRed: 1, limpiar: 1, soberania: progreso(f, s(0.15), s(1.2), easeInOutCubic) })}
  />
);

export const Acto7: React.FC = () => (
  <Tomas
    tomas={[
      { dur: 12.0, componente: Historia },
      { dur: 3.7, componente: Canerias },
      { dur: 2.9, componente: Tarifas },
      { dur: 1.3, componente: Hijos },
      { dur: 1.4, componente: Barrios },
      { dur: 1.4, componente: Pueblos },
      { dur: 1.5, componente: Futuro },
      { dur: 2.5, componente: Soberania },
    ]}
  />
);
