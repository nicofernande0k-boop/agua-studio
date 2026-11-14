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
