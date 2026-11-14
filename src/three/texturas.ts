import * as THREE from "three";
import { crearAzar } from "../lib/anim";

/**
 * Texturas procedurales dibujadas en canvas: no dependen de archivos ni de
 * internet y son idénticas en cada render.
 */

function lienzo(ancho: number, alto: number, dibujar: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d")!;
  dibujar(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Tejas coloniales: hileras con sombra en la parte baja de cada teja. */
export function texturaTejas() {
  const azar = crearAzar(11);
  return lienzo(256, 256, (c) => {
    const filas = 8;
    const cols = 6;
    const h = 256 / filas;
    const w = 256 / cols;
    for (let f = 0; f < filas; f++) {
      for (let k = -1; k <= cols; k++) {
        const x = k * w + (f % 2 ? w / 2 : 0);
        const y = f * h;
        const tono = azar.entre(-10, 10);
        const g = c.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, `hsl(${14 + tono * 0.3}, 62%, ${36 + tono * 0.4}%)`);
        g.addColorStop(0.5, `hsl(${16 + tono * 0.3}, 66%, ${50 + tono * 0.4}%)`);
        g.addColorStop(1, `hsl(${14 + tono * 0.3}, 62%, ${34 + tono * 0.4}%)`);
        c.fillStyle = g;
        c.beginPath();
        c.roundRect(x + 1, y, w - 2, h + 2, [0, 0, w / 2, w / 2]);
        c.fill();
        c.fillStyle = "rgba(40,10,0,0.35)";
        c.fillRect(x + 1, y + h - 3, w - 2, 3);
      }
    }
  });
}

/** Azulejos blancos tipo subte con guarda verde agua. */
export function texturaAzulejos() {
  return lienzo(256, 256, (c) => {
    c.fillStyle = "#c9d3d4";
    c.fillRect(0, 0, 256, 256);
    const filas = 8;
    const h = 256 / filas;
    const w = 64;
    for (let f = 0; f < filas; f++) {
      for (let k = -1; k < 5; k++) {
        const x = k * w + (f % 2 ? w / 2 : 0);
        const y = f * h;
        const guarda = f === 0;
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, guarda ? "#7fd1c3" : "#ffffff");
        g.addColorStop(1, guarda ? "#5fb8aa" : "#eef3f3");
        c.fillStyle = g;
        c.fillRect(x + 2, y + 2, w - 4, h - 4);
      }
    }
  });
}

/** Piso calcáreo en damero blanco y negro. */
export function texturaDamero() {
  return lienzo(256, 256, (c) => {
    const n = 4;
    const s = 256 / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        c.fillStyle = (i + j) % 2 ? "#1f2326" : "#efe9de";
        c.fillRect(i * s, j * s, s, s);
      }
    }
    c.strokeStyle = "rgba(120,120,120,0.5)";
    c.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      c.beginPath();
      c.moveTo(i * s, 0);
      c.lineTo(i * s, 256);
      c.moveTo(0, i * s);
      c.lineTo(256, i * s);
      c.stroke();
    }
  });
}

/** Corte de suelo: estratos de tierra con piedritas. */
export function texturaSuelo() {
  const azar = crearAzar(7);
  return lienzo(512, 512, (c) => {
    const capas = ["#5a3b26", "#6b4630", "#4d3322", "#7a5236", "#583926", "#3f2a1c"];
    let y = 0;
    let k = 0;
    while (y < 512) {
      const alto = azar.entre(50, 110);
      c.fillStyle = capas[k % capas.length];
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) c.lineTo(x, y + Math.sin(x * 0.02 + k) * 6);
      c.lineTo(512, y + alto + 10);
      c.lineTo(0, y + alto + 10);
      c.fill();
      y += alto;
      k++;
    }
    for (let i = 0; i < 380; i++) {
      const l = azar.entre(28, 62);
      c.fillStyle = `hsla(28, ${azar.entre(10, 30)}%, ${l}%, ${azar.entre(0.25, 0.7)})`;
      c.beginPath();
      c.ellipse(azar.entre(0, 512), azar.entre(0, 512), azar.entre(1.5, 6), azar.entre(1, 4), azar.entre(0, 3), 0, Math.PI * 2);
      c.fill();
    }
  });
}

/** Esfera del manómetro con zona roja en cero. */
export function texturaManometro() {
  const tex = lienzo(256, 256, (c) => {
    c.fillStyle = "#f4f1ea";
    c.beginPath();
    c.arc(128, 128, 124, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 14;
    c.strokeStyle = "#d93a3a";
    c.beginPath();
    c.arc(128, 128, 96, Math.PI * 0.75, Math.PI * 0.95);
    c.stroke();
    c.strokeStyle = "#2f8f6b";
    c.beginPath();
    c.arc(128, 128, 96, Math.PI * 1.55, Math.PI * 2.1);
    c.stroke();
    c.strokeStyle = "#222";
    c.lineWidth = 4;
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      c.beginPath();
      c.moveTo(128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80);
      c.lineTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104);
      c.stroke();
    }
    c.fillStyle = "#222";
    c.font = "bold 28px sans-serif";
    c.textAlign = "center";
    c.fillText("bar", 128, 196);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Cartel con texto. Usa Inter (cargada antes de crear la escena) y cae en
 * sans-serif si no estuviera disponible.
 */
export function texturaTexto(
  texto: string,
  {
    ancho = 512,
    alto = 128,
    fondo = "#ffffff",
    color = "#1d2433",
    peso = 800,
    tamano = 64,
    borde,
  }: { ancho?: number; alto?: number; fondo?: string | null; color?: string; peso?: number; tamano?: number; borde?: string } = {},
) {
  const tex = lienzo(ancho, alto, (c) => {
    if (fondo) {
      c.fillStyle = fondo;
      c.beginPath();
      c.roundRect(0, 0, ancho, alto, alto * 0.12);
      c.fill();
    }
    if (borde) {
      c.strokeStyle = borde;
      c.lineWidth = alto * 0.06;
      c.beginPath();
      c.roundRect(c.lineWidth / 2, c.lineWidth / 2, ancho - c.lineWidth, alto - c.lineWidth, alto * 0.12);
      c.stroke();
    }
    c.fillStyle = color;
    c.font = `${peso} ${tamano}px Inter, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const lineas = texto.split("\n");
    lineas.forEach((l, i) => c.fillText(l, ancho / 2, alto / 2 + (i - (lineas.length - 1) / 2) * tamano * 1.1));
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Bandera argentina con Sol de Mayo simplificado. */
export function texturaBandera() {
  const tex = lienzo(300, 190, (c) => {
    c.fillStyle = "#74acdf";
    c.fillRect(0, 0, 300, 190);
    c.fillStyle = "#ffffff";
    c.fillRect(0, 63, 300, 64);
    c.fillStyle = "#f6b40e";
    c.beginPath();
    c.arc(150, 95, 17, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#f6b40e";
    c.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      c.beginPath();
      c.moveTo(150 + Math.cos(a) * 19, 95 + Math.sin(a) * 19);
      c.lineTo(150 + Math.cos(a) * 28, 95 + Math.sin(a) * 28);
      c.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** Sol de Mayo simplificado (sin rostro), con rayos rectos y ondulados. */
export function texturaSol() {
  const tex = lienzo(512, 512, (c) => {
    const g = c.createRadialGradient(256, 256, 40, 256, 256, 250);
    g.addColorStop(0, "rgba(255,214,90,0.9)");
    g.addColorStop(0.35, "rgba(246,180,14,0.35)");
    g.addColorStop(1, "rgba(246,180,14,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
    c.strokeStyle = "#f6b40e";
    c.lineCap = "round";
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      c.lineWidth = 9;
      c.beginPath();
      if (i % 2 === 0) {
        c.moveTo(256 + Math.cos(a) * 90, 256 + Math.sin(a) * 90);
        c.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200);
      } else {
        for (let k = 0; k <= 12; k++) {
          const r = 90 + k * 8.5;
          const off = Math.sin(k * 1.4) * 0.05;
          const x = 256 + Math.cos(a + off) * r;
          const y = 256 + Math.sin(a + off) * r;
          if (k === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
      }
      c.stroke();
    }
    c.fillStyle = "#f6b40e";
    c.beginPath();
    c.arc(256, 256, 80, 0, Math.PI * 2);
    c.fill();
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
