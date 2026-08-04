import L from "leaflet";

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

function heatColor(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  if (t < 0.25) return `rgba(34,211,238,${0.55})`;
  if (t < 0.5) return `rgba(74,222,128,${0.6})`;
  if (t < 0.75) return `rgba(250,204,21,${0.7})`;
  return `rgba(239,68,68,${0.85})`;
}

/**
 * Lightweight canvas heat layer that renders a set of weighted points.
 * Self-contained (no external heatmap dependency) and safe for large
 * datasets since it redraws only on map move/zoom.
 */
export class RiskHeatLayer extends L.Layer {
  private points: HeatPoint[];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private mapRef: L.Map | null = null;

  constructor(points: HeatPoint[] = [], options?: L.LayerOptions) {
    super(options);
    this.points = points;
  }

  setPoints(points: HeatPoint[]): void {
    this.points = points;
    if (this.mapRef) this.reset();
  }

  onAdd(map: L.Map): this {
    this.mapRef = map;
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.pointerEvents = "none";
    this.ctx = this.canvas.getContext("2d");
    map.getPanes().overlayPane.appendChild(this.canvas);
    map.on("moveend zoomend viewreset resize", this.reset, this);
    this.reset();
    return this;
  }

  onRemove(map: L.Map): this {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    map.off("moveend zoomend viewreset resize", this.reset, this);
    this.canvas = null;
    this.ctx = null;
    this.mapRef = null;
    return this;
  }

  private reset = (): void => {
    const map = this.mapRef;
    if (!map || !this.canvas || !this.ctx) return;

    const size = map.getSize();
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    this.canvas.style.width = `${size.x}px`;
    this.canvas.style.height = `${size.y}px`;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, size.x, size.y);
    if (!this.points.length) return;

    const topLeft = map.containerPointToLayerPoint([0, 0]);
    for (const point of this.points) {
      const layerPoint = map.latLngToLayerPoint([point.lat, point.lng]);
      const x = layerPoint.x - topLeft.x;
      const y = layerPoint.y - topLeft.y;
      const radius = Math.max(14, 34 * Math.max(0.25, point.intensity));
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, heatColor(point.intensity));
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

export function makeHeatPoints(points: Array<{ lat: number; lng: number; intensity: number }>): HeatPoint[] {
  return points;
}
