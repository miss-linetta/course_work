import * as fs from 'fs';

export interface Point { x: number; y: number; }

export class Task {
    n: number;
    R: number;
    points: Point[];
    weights: number[];

    constructor(n: number, R: number, points: Point[], weights: number[]) {
        this.n = n;
        this.R = R;
        this.points = points;
        this.weights = weights;
    }

    static generate(n: number, R: number, wMin: number, wMax: number): Task {
        const points: Point[] = [];
        const weights: number[] = [];
        while (points.length < n) {
            const x = Math.random() * 2 * R - R;
            const y = Math.random() * 2 * R - R;
            if (x * x + y * y <= R * R) {
                points.push({ x, y });
                weights.push(wMin + Math.random() * (wMax - wMin));
            }
        }
        return new Task(n, R, points, weights);
    }

    static load(path: string): Task {
        const data = fs.readFileSync(path, 'utf-8').trim().split(/\r?\n/);
        const [nStr, RStr] = data[0].split(' ');
        const n = parseInt(nStr, 10);
        const R = parseFloat(RStr);
        const points: Point[] = [];
        const weights: number[] = [];
        for (let i = 1; i <= n; i++) {
            const [xStr, yStr, wStr] = data[i].split(' ');
            points.push({ x: parseFloat(xStr), y: parseFloat(yStr) });
            weights.push(parseFloat(wStr));
        }
        return new Task(n, R, points, weights);
    }

    save(path: string): void {
        const lines: string[] = [];
        lines.push(`${this.n} ${this.R}`);
        for (let i = 0; i < this.n; i++) {
            lines.push(`${this.points[i].x} ${this.points[i].y} ${this.weights[i]}`);
        }
        fs.writeFileSync(path, lines.join('\n'), 'utf-8');
    }
}