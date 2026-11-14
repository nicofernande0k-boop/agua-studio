import type { EstadoEscenario } from "../../three/Escenario";

/** Cielos de la versión narrada. */
export const AMANECER: EstadoEscenario["cielo"] = { color: "#f3c7a6", sol: "#ffb27a", intensidad: 2.3, direccion: [70, 22, 40] };
export const DORADO: EstadoEscenario["cielo"] = { color: "#f6d7b0", sol: "#ffc98a", intensidad: 2.5, direccion: [-60, 30, 50] };
export const MADRUGADA: EstadoEscenario["cielo"] = { color: "#3a4d78", sol: "#9fb4ff", intensidad: 0.9, direccion: [40, 20, 20] };
export const LLUVIA: EstadoEscenario["cielo"] = { color: "#8796a6", sol: "#d8e2ee", intensidad: 1.1, direccion: [-20, 50, 20] };
