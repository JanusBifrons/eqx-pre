import { IComponent } from '@/core/types';
import { Vector } from 'matter-js';

export class ShipComponent implements IComponent {
    public readonly type = 'ship';
    public readonly entityId: string;

    public name: string = 'Unnamed Ship';
    public centerOfMass: Vector = { x: 0, y: 0 };
    public isConstructed: boolean = false;
    public pilot: string | null = null;

    // Performance metrics
    public maxSpeed: number = 0;
    public acceleration: number = 0;
    public maneuverability: number = 0;

    // Resource management
    public fuel: number = 100;
    public maxFuel: number = 100;
    public power: number = 100;
    public maxPower: number = 100;

    // Combat stats
    public shield: number = 0;
    public maxShield: number = 0;
    public armor: number = 0;

    constructor(entityId: string) {
        this.entityId = entityId;
    }

    public setConstructed(isConstructed: boolean): void {
        this.isConstructed = isConstructed;
    }

    public setPilot(pilotId: string | null): void {
        this.pilot = pilotId;
    }

    public consumeFuel(amount: number): boolean {
        if (this.fuel >= amount) {
            this.fuel = Math.max(0, this.fuel - amount);
            return true;
        }
        return false;
    }

    public consumePower(amount: number): boolean {
        if (this.power >= amount) {
            this.power = Math.max(0, this.power - amount);
            return true;
        }
        return false;
    }

    public refuel(amount: number): void {
        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    }

    public recharge(amount: number): void {
        this.power = Math.min(this.maxPower, this.power + amount);
    }

    public takeDamage(amount: number): number {
        let remainingDamage = amount;

        // Shields absorb damage first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, remainingDamage);
            this.shield -= shieldDamage;
            remainingDamage -= shieldDamage;
        }

        // Armor reduces remaining damage
        if (remainingDamage > 0 && this.armor > 0) {
            const damageReduction = Math.min(remainingDamage * 0.1, this.armor * 0.05);
            remainingDamage = Math.max(0, remainingDamage - damageReduction);
        }

        return remainingDamage;
    }

    public regenerateShield(amount: number): void {
        this.shield = Math.min(this.maxShield, this.shield + amount);
    }

    public getFuelPercentage(): number {
        return this.maxFuel > 0 ? this.fuel / this.maxFuel : 0;
    }

    public getPowerPercentage(): number {
        return this.maxPower > 0 ? this.power / this.maxPower : 0;
    }

    public getShieldPercentage(): number {
        return this.maxShield > 0 ? this.shield / this.maxShield : 0;
    }

    public update(deltaTime: number): void {
        // Passive shield regeneration
        if (this.shield < this.maxShield) {
            this.regenerateShield(deltaTime * 2);
        }

        // Passive power regeneration
        if (this.power < this.maxPower) {
            this.recharge(deltaTime * 5);
        }
    }
}
