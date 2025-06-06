import { Task } from './dataModule';

export class GreedySolver {
    static solve(task: Task): { xLine: number; yLine: number; D: number } {
        let bestD = Infinity;
        let bestX = 0;
        let bestY = 0;

        for (const ptY of task.points) {
            for (const ptX of task.points) {
                const xk = ptX.x;
                const yi = ptY.y;
                const sums = [0, 0, 0, 0];
                for (let j = 0; j < task.n; j++) {
                    const { x, y } = task.points[j];
                    const w = task.weights[j];
                    let idx: number;
                    if (x < xk && y < yi) idx = 0;
                    else if (x >= xk && y < yi) idx = 1;
                    else if (x >= xk && y >= yi) idx = 2;
                    else idx = 3;
                    sums[idx] += w;
                }
                const D = Math.max(...sums) - Math.min(...sums);
                if (D < bestD) {
                    bestD = D;
                    bestX = xk;
                    bestY = yi;
                }
            }
        }

        return { xLine: bestX, yLine: bestY, D: bestD };
    }
}


export class AggregateSolver {
    static solve(
        task: Task,
        pi: number,
        deltaTheta: number
    ): { theta: number; D: number } {
        const S = task.weights.reduce((a, b) => a + b, 0);
        const xC =
            task.points.reduce((sum, p, i) => sum + p.x * task.weights[i], 0) / S;
        const yC =
            task.points.reduce((sum, p, i) => sum + p.y * task.weights[i], 0) / S;

        const K = Math.floor((2 * Math.PI) / deltaTheta);
        let bestD = Infinity;
        let bestTheta = 0;
        let stagn = 0;

        for (let k = 0; k < K; k++) {
            const theta = k * deltaTheta;
            const sums = [0, 0, 0, 0];

            for (let j = 0; j < task.n; j++) {
                const dx = task.points[j].x - xC;
                const dy = task.points[j].y - yC;
                let alpha = Math.atan2(dy, dx) - theta;
                if (alpha < 0) alpha += 2 * Math.PI;
                const idx = Math.floor(alpha / (Math.PI / 2));
                sums[idx] += task.weights[j];
            }

            const D = Math.max(...sums) - Math.min(...sums);
            if (D < bestD) {
                bestD = D;
                bestTheta = theta;
                stagn = 0;
            } else {
                stagn++;
            }

            if (stagn >= pi) {
                break;
            }
        }

        return { theta: bestTheta, D: bestD };
    }
}
