import { Vector2 } from '@/core/types';

export class MathUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  static distance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalize(vector: Vector2): Vector2 {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vector.x / length, y: vector.y / length };
  }

  static radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  }

  static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max + 1));
  }
}

export class TimeUtils {
  static formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000) % 60;
    const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  static fps(deltaTime: number): number {
    return Math.round(1 / deltaTime);
  }
}

export class ColorUtils {
  static hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 255,
      g: (hex >> 8) & 255,
      b: hex & 255,
    };
  }

  static rgbToHex(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  }

  static randomColor(): number {
    return Math.floor(Math.random() * 0xffffff);
  }
}
