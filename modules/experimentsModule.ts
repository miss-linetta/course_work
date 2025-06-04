import { Task } from './dataModule';
import { GreedySolver, AggregateSolver } from './algorithmsModule';
import * as fs from 'fs';

type Result = {
    n: number;
    pi: number;
    timeGreedy: number;
    DGreedy: number;
    timeAgg: number;
    DAgg: number;
};

export interface ExperimentConfig {
    nRange: [number, number, number]; // from, to (inclusive), step
    kTasks: number;
    piRange: number[];
}

export class Experiment {
    cfg: ExperimentConfig;
    results: Result[] = [];

    constructor(cfg: ExperimentConfig) {
        this.cfg = cfg;
    }

    run(): Result[] {
        const [nMin, nMax, step] = this.cfg.nRange;
        for (let n = nMin; n <= nMax; n += step) {
            for (const pi of this.cfg.piRange) {
                for (let k = 0; k < this.cfg.kTasks; k++) {
                    const task = Task.generate(n, 1.0, 1.0, 10.0);
                    const t0 = Date.now();
                    const { D: Dg } = GreedySolver.solve(task);
                    const tg = (Date.now() - t0) / 1000;

                    const t1 = Date.now();
                    const { D: Da } = AggregateSolver.solve(task, pi);
                    const ta = (Date.now() - t1) / 1000;

                    this.results.push({ n, pi, timeGreedy: tg, DGreedy: Dg, timeAgg: ta, DAgg: Da });
                }
            }
        }
        return this.results;
    }

    saveCSV(path: string): void {
        const header = 'n,pi,timeGreedy,DGreedy,timeAgg,DAgg';
        const lines = this.results.map(r =>
            `${r.n},${r.pi},${r.timeGreedy},${r.DGreedy},${r.timeAgg},${r.DAgg}`
        );
        fs.writeFileSync(path, [header, ...lines].join('\n'), 'utf-8');
    }
}