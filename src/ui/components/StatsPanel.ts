import { Graphics, Text } from 'pixi.js';
import { BaseUIComponent } from './BaseUIComponent';
import { Ship } from '@/entities/Ship';

export class StatsPanel extends BaseUIComponent {
    private readonly STATS_WIDTH = 300;
    private readonly STATS_HEIGHT = 200;
    private statsText!: Text;

    constructor() {
        super();
        this.setupStatsPanel();
    }

    private setupStatsPanel(): void {
        // Stats background
        const statsBg = new Graphics();
        statsBg.beginFill(0x222222, 0.9);
        statsBg.drawRect(0, 0, this.STATS_WIDTH, this.STATS_HEIGHT);
        statsBg.endFill();
        this.container.addChild(statsBg);

        // Stats title
        const statsTitle = new Text('Ship Statistics', { fill: 0xFFFFFF, fontSize: 16 });
        statsTitle.x = 10;
        statsTitle.y = 10;
        this.container.addChild(statsTitle);

        // Stats text
        this.statsText = new Text('', { fill: 0xFFFFFF, fontSize: 14 });
        this.statsText.x = 10;
        this.statsText.y = 35;
        this.container.addChild(this.statsText);
    }

    public updateStats(ship: Ship): void {
        const stats = ship.calculateStats();
        const validation = ship.validateStructuralIntegrity();

        let statsString = `Blocks: ${stats.blockCount}\n`;
        statsString += `Total Mass: ${stats.totalMass.toFixed(1)}\n`;
        statsString += `Center of Mass: (${stats.centerOfMass.x.toFixed(1)}, ${stats.centerOfMass.y.toFixed(1)})\n`;
        statsString += `Total Thrust: ${stats.totalThrust}\n`;
        statsString += `Total Armor: ${stats.totalArmor}\n`;
        statsString += `Weapons: ${stats.totalWeapons}\n\n`;

        if (!validation.isValid) {
            statsString += 'Issues:\n';
            validation.issues.forEach(issue => {
                statsString += `• ${issue}\n`;
            });
        } else {
            statsString += 'Ship is valid!';
        }

        this.statsText.text = statsString;
    }

    resize(width: number, height: number): void {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        this.setPosition(halfWidth - this.STATS_WIDTH - 10, -halfHeight + 10);
    }
}
