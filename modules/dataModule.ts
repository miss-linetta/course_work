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
        if (data.length < 1) {
            throw new Error('Файл порожній або некоректний.');
        }

        const [nStr, RStr] = data[0].trim().split(/\s+/);
        const n = parseInt(nStr, 10);
        const R = parseFloat(RStr);
        if (isNaN(n) || isNaN(R)) throw new Error('Некоректні n або R у першому рядку.');
        if (data.length < n + 1) {
            throw new Error(`Очікується ${n} точок, але знайдено ${data.length - 1}.`);
        }

        const points: Point[] = [];
        const weights: number[] = [];
        for (let i = 1; i <= n; i++) {
            const parts = data[i].trim().split(/\s+/);
            if (parts.length < 3) throw new Error(`Рядок ${i + 1} має формат "x y w".`);
            const x = parseFloat(parts[0]);
            const y = parseFloat(parts[1]);
            const w = parseFloat(parts[2]);
            if (isNaN(x) || isNaN(y) || isNaN(w)) {
                throw new Error(`Некоректні значення у рядку ${i + 1}.`);
            }
            points.push({ x, y });
            weights.push(w);
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
