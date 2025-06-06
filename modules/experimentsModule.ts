import { Task } from './dataModule';
import { GreedySolver, AggregateSolver } from './algorithmsModule';
import * as fs from 'fs';
import * as path from 'path';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

export type PiResult = {
    pi: number;
    fixedDeltaTheta: number;
    fixedWeightRange: [number, number];
    timeGreedy: number;
    DGreedy: number;
    timeAgg: number;
    DAgg: number;
};

export type ThetaResult = {
    deltaTheta: number;
    fixedPi: number;
    fixedWeightRange: [number, number];
    timeGreedy: number;
    DGreedy: number;
    timeAgg: number;
    DAgg: number;
};

export type FinalResult = {
    n: number;
    weightRange: [number, number];
    fixedPi: number;
    fixedDeltaTheta: number;
    timeGreedy: number;
    DGreedy: number;
    timeAgg: number;
    DAgg: number;
};

export interface PiExperimentConfig {
    n: number;
    deltaTheta: number;
    weightRange: [number, number];
    piRange: number[];
    kTasks: number;
}

export interface ThetaExperimentConfig {
    n: number;
    pi: number;
    weightRange: [number, number];
    thetaRange: number[];
    kTasks: number;
}

export interface FinalExperimentConfig {
    nRange: [number, number, number];
    weightRanges: [number, number][];
    pi: number;
    deltaTheta: number;
    kTasks: number;
}

export class Experiment {
    piConfig?: PiExperimentConfig;
    thetaConfig?: ThetaExperimentConfig;
    finalConfig?: FinalExperimentConfig;

    piResults: PiResult[] = [];
    thetaResults: ThetaResult[] = [];
    finalResults: FinalResult[] = [];

    constructor() {}

    /**
     * Налаштування для експерименту 3.4.1 (вплив π)
     */
    setPiConfig(cfg: PiExperimentConfig): void {
        this.piConfig = cfg;
        this.piResults = [];
    }

    /**
     * Запуск експерименту 3.4.1: вплив π
     */
    runPiExperiments(): void {
        if (!this.piConfig) throw new Error('PiConfig не встановлено');

        const { n, deltaTheta, weightRange, piRange, kTasks } = this.piConfig;

        for (const pi of piRange) {
            let sumTimeG = 0;
            let sumDG = 0;
            let sumTimeA = 0;
            let sumDA = 0;

            for (let run = 0; run < kTasks; run++) {
                const task = Task.generate(n, 1.0, weightRange[0], weightRange[1]);

                // Жадібний алгоритм
                const t0 = Date.now();
                const { D: Dg } = GreedySolver.solve(task);
                const tg = (Date.now() - t0) / 1000;

                // Агрегований з поточним π
                const t1 = Date.now();
                const { D: Da } = AggregateSolver.solve(task, pi, deltaTheta);
                const ta = (Date.now() - t1) / 1000;

                sumTimeG += tg;
                sumDG += Dg;
                sumTimeA += ta;
                sumDA += Da;
            }

            const avgTimeG = sumTimeG / kTasks;
            const avgDG = sumDG / kTasks;
            const avgTimeA = sumTimeA / kTasks;
            const avgDA = sumDA / kTasks;

            this.piResults.push({
                pi,
                fixedDeltaTheta: deltaTheta,
                fixedWeightRange: weightRange,
                timeGreedy: avgTimeG,
                DGreedy: avgDG,
                timeAgg: avgTimeA,
                DAgg: avgDA
            });
        }
    }

    /**
     * Зберегти результати експерименту 3.4.1 у CSV і збудувати графіки
     */
    async savePiChartsAndCSV(outputDir: string): Promise<void> {
        if (!this.piConfig) throw new Error('PiConfig не встановлено');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // CSV
        const header = 'pi,deltaTheta,wMin,wMax,timeGreedy,DGreedy,timeAgg,DAgg';
        const lines = this.piResults.map(r => {
            const [wMin, wMax] = r.fixedWeightRange;
            return `${r.pi},${r.fixedDeltaTheta},${wMin},${wMax},${r.timeGreedy},${r.DGreedy},${r.timeAgg},${r.DAgg}`;
        });
        fs.writeFileSync(path.join(outputDir, 'pi_experiments.csv'), [header, ...lines].join('\n'), 'utf-8');

        // Графіки
        const width = 800, height = 600;
        const chartCallback = (ChartJS: any) => {
            ChartJS.defaults.font.family = 'Arial';
            ChartJS.defaults.font.size = 16;
        };
        const canvas = new ChartJSNodeCanvas({ width, height, chartCallback });

        // t(pi)
        const labelsPi = this.piResults.map(r => r.pi.toString());
        const timesG = this.piResults.map(r => r.timeGreedy);
        const timesA = this.piResults.map(r => r.timeAgg);
        const configTime = {
            type: 'line' as const,
            data: {
                labels: labelsPi,
                datasets: [
                    {
                        label: 'Жадібний (t)',
                        data: timesG,
                        borderColor: 'rgba(255, 99, 132, 0.9)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    },
                    {
                        label: 'Зведений (t)',
                        data: timesA,
                        borderColor: 'rgba(54, 162, 235, 0.9)',
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Час t(π), Δθ=${this.piConfig.deltaTheta.toFixed(3)}, wMin=${this.piConfig.weightRange[0]}–wMax=${this.piConfig.weightRange[1]}`,
                        font: { size: 18 }
                    },
                    legend: { position: 'top' as const }
                },
                scales: {
                    x: { title: { display: true, text: 'π' } },
                    y: { title: { display: true, text: 'Час (с)' }, beginAtZero: true }
                }
            }
        };
        const bufferTime = await canvas.renderToBuffer(configTime);
        fs.writeFileSync(path.join(outputDir, 'time_vs_pi.png'), bufferTime);

        // D(pi)
        const DgArr = this.piResults.map(r => r.DGreedy);
        const DaArr = this.piResults.map(r => r.DAgg);
        const configD = {
            type: 'line' as const,
            data: {
                labels: labelsPi,
                datasets: [
                    {
                        label: 'Жадібний (D)',
                        data: DgArr,
                        borderColor: 'rgba(255, 159, 64, 0.9)',
                        backgroundColor: 'rgba(255, 159, 64, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    },
                    {
                        label: 'Зведений (D)',
                        data: DaArr,
                        borderColor: 'rgba(75, 192, 192, 0.9)',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: false,
                plugins: {
                    title: {
                        display: true,
                        text: `D(π), Δθ=${this.piConfig.deltaTheta.toFixed(3)}, wMin=${this.piConfig.weightRange[0]}–wMax=${this.piConfig.weightRange[1]}`,
                        font: { size: 18 }
                    },
                    legend: { position: 'top' as const }
                },
                scales: {
                    x: { title: { display: true, text: 'π' } },
                    y: { title: { display: true, text: 'D' }, beginAtZero: false }
                }
            }
        };
        const bufferD = await canvas.renderToBuffer(configD);
        fs.writeFileSync(path.join(outputDir, 'D_vs_pi.png'), bufferD);
    }

    /**
     * Налаштування для експерименту 3.4.2 (вплив Δθ)
     */
    setThetaConfig(cfg: ThetaExperimentConfig): void {
        this.thetaConfig = cfg;
        this.thetaResults = [];
    }

    /**
     * Запуск експерименту 3.4.2: вплив Δθ
     */
    runThetaExperiments(): void {
        if (!this.thetaConfig) throw new Error('ThetaConfig не встановлено');

        const { n, pi, weightRange, thetaRange, kTasks } = this.thetaConfig;

        for (const deltaTheta of thetaRange) {
            let sumTimeG = 0;
            let sumDG = 0;
            let sumTimeA = 0;
            let sumDA = 0;

            for (let run = 0; run < kTasks; run++) {
                const task = Task.generate(n, 1.0, weightRange[0], weightRange[1]);

                const t0 = Date.now();
                const { D: Dg } = GreedySolver.solve(task);
                const tg = (Date.now() - t0) / 1000;

                const t1 = Date.now();
                const { D: Da } = AggregateSolver.solve(task, pi, deltaTheta);
                const ta = (Date.now() - t1) / 1000;

                sumTimeG += tg;
                sumDG += Dg;
                sumTimeA += ta;
                sumDA += Da;
            }

            const avgTimeG = sumTimeG / kTasks;
            const avgDG = sumDG / kTasks;
            const avgTimeA = sumTimeA / kTasks;
            const avgDA = sumDA / kTasks;

            this.thetaResults.push({
                deltaTheta,
                fixedPi: pi,
                fixedWeightRange: weightRange,
                timeGreedy: avgTimeG,
                DGreedy: avgDG,
                timeAgg: avgTimeA,
                DAgg: avgDA
            });
        }
    }

    /**
     * Зберегти результати експерименту 3.4.2 у CSV і збудувати графіки
     */
    async saveThetaChartsAndCSV(outputDir: string): Promise<void> {
        if (!this.thetaConfig) throw new Error('ThetaConfig не встановлено');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // CSV
        const header = 'deltaTheta,pi,wMin,wMax,timeGreedy,DGreedy,timeAgg,DAgg';
        const lines = this.thetaResults.map(r => {
            const [wMin, wMax] = r.fixedWeightRange;
            return `${r.deltaTheta},${r.fixedPi},${wMin},${wMax},${r.timeGreedy},${r.DGreedy},${r.timeAgg},${r.DAgg}`;
        });
        fs.writeFileSync(path.join(outputDir, 'theta_experiments.csv'), [header, ...lines].join('\n'), 'utf-8');

        // Графіки
        const width = 800, height = 600;
        const chartCallback = (ChartJS: any) => {
            ChartJS.defaults.font.family = 'Arial';
            ChartJS.defaults.font.size = 16;
        };
        const canvas = new ChartJSNodeCanvas({ width, height, chartCallback });

        // t(Δθ)
        const labelsTh = this.thetaResults.map(r => r.deltaTheta.toFixed(3));
        const timesG = this.thetaResults.map(r => r.timeGreedy);
        const timesA = this.thetaResults.map(r => r.timeAgg);
        const configTime = {
            type: 'line' as const,
            data: {
                labels: labelsTh,
                datasets: [
                    {
                        label: 'Жадібний (t)',
                        data: timesG,
                        borderColor: 'rgba(153, 102, 255, 0.9)',
                        backgroundColor: 'rgba(153, 102, 255, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    },
                    {
                        label: 'Зведений (t)',
                        data: timesA,
                        borderColor: 'rgba(255, 205, 86, 0.9)',
                        backgroundColor: 'rgba(255, 205, 86, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Час t(Δθ), π=${this.thetaConfig.pi}, wMin=${this.thetaConfig.weightRange[0]}–wMax=${this.thetaConfig.weightRange[1]}`,
                        font: { size: 18 }
                    },
                    legend: { position: 'top' as const }
                },
                scales: {
                    x: { title: { display: true, text: 'Δθ (рад)' } },
                    y: { title: { display: true, text: 'Час (с)' }, beginAtZero: true }
                }
            }
        };
        const bufferTime = await canvas.renderToBuffer(configTime);
        fs.writeFileSync(path.join(outputDir, 'time_vs_deltaTheta.png'), bufferTime);

        // D(Δθ)
        const DgArr = this.thetaResults.map(r => r.DGreedy);
        const DaArr = this.thetaResults.map(r => r.DAgg);
        const configD = {
            type: 'line' as const,
            data: {
                labels: labelsTh,
                datasets: [
                    {
                        label: 'Жадібний (D)',
                        data: DgArr,
                        borderColor: 'rgba(54, 162, 235, 0.9)',
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    },
                    {
                        label: 'Зведений (D)',
                        data: DaArr,
                        borderColor: 'rgba(255, 99, 132, 0.9)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: false,
                plugins: {
                    title: {
                        display: true,
                        text: `D(Δθ), π=${this.thetaConfig.pi}, wMin=${this.thetaConfig.weightRange[0]}–wMax=${this.thetaConfig.weightRange[1]}`,
                        font: { size: 18 }
                    },
                    legend: { position: 'top' as const }
                },
                scales: {
                    x: { title: { display: true, text: 'Δθ (рад)' } },
                    y: { title: { display: true, text: 'D' }, beginAtZero: false }
                }
            }
        };
        const bufferD = await canvas.renderToBuffer(configD);
        fs.writeFileSync(path.join(outputDir, 'D_vs_deltaTheta.png'), bufferD);
    }

    /**
     * Налаштування для експерименту 3.4.3 (вплив n та Δw)
     */
    setFinalConfig(cfg: FinalExperimentConfig): void {
        this.finalConfig = cfg;
        this.finalResults = [];
    }

    /**
     * Запуск експерименту 3.4.3: вплив n та Δw
     */
    runFinalExperiments(): void {
        if (!this.finalConfig) throw new Error('FinalConfig не встановлено');

        const { nRange, weightRanges, pi, deltaTheta, kTasks } = this.finalConfig;
        const [nMin, nMax, step] = nRange;

        for (let n = nMin; n <= nMax; n += step) {
            for (const wRange of weightRanges) {
                let sumTimeG = 0;
                let sumDG = 0;
                let sumTimeA = 0;
                let sumDA = 0;

                for (let run = 0; run < kTasks; run++) {
                    const task = Task.generate(n, 1.0, wRange[0], wRange[1]);

                    const t0 = Date.now();
                    const { D: Dg } = GreedySolver.solve(task);
                    const tg = (Date.now() - t0) / 1000;

                    const t1 = Date.now();
                    const { D: Da } = AggregateSolver.solve(task, pi, deltaTheta);
                    const ta = (Date.now() - t1) / 1000;

                    sumTimeG += tg;
                    sumDG += Dg;
                    sumTimeA += ta;
                    sumDA += Da;
                }

                const avgTimeG = sumTimeG / kTasks;
                const avgDG = sumDG / kTasks;
                const avgTimeA = sumTimeA / kTasks;
                const avgDA = sumDA / kTasks;

                this.finalResults.push({
                    n,
                    weightRange: wRange,
                    fixedPi: pi,
                    fixedDeltaTheta: deltaTheta,
                    timeGreedy: avgTimeG,
                    DGreedy: avgDG,
                    timeAgg: avgTimeA,
                    DAgg: avgDA
                });
            }
        }
    }

    /**
     * Зберегти результати експерименту 3.4.3 у CSV і збудувати графіки
     */
    async saveFinalChartsAndCSV(outputDir: string): Promise<void> {
        if (!this.finalConfig) throw new Error('FinalConfig не встановлено');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // CSV
        const header = 'n,wMin,wMax,pi,deltaTheta,timeGreedy,DGreedy,timeAgg,DAgg';
        const lines = this.finalResults.map(r => {
            const [wMin, wMax] = r.weightRange;
            return `${r.n},${wMin},${wMax},${r.fixedPi},${r.fixedDeltaTheta},${r.timeGreedy},${r.DGreedy},${r.timeAgg},${r.DAgg}`;
        });
        fs.writeFileSync(path.join(outputDir, 'final_experiments.csv'), [header, ...lines].join('\n'), 'utf-8');

        // Графіки
        const width = 800, height = 600;
        const chartCallback = (ChartJS: any) => {
            ChartJS.defaults.font.family = 'Arial';
            ChartJS.defaults.font.size = 16;
        };
        const canvas = new ChartJSNodeCanvas({ width, height, chartCallback });

        // Знайдемо унікальні weightRanges
        const uniqueWR = Array.from(
            new Set(this.finalResults.map(r => JSON.stringify(r.weightRange)))
        ).map(s => JSON.parse(s) as [number, number]);

        for (const wRange of uniqueWR) {
            const subset = this.finalResults
                .filter(r => JSON.stringify(r.weightRange) === JSON.stringify(wRange))
                .sort((a, b) => a.n - b.n);

            const labelsN = subset.map(r => r.n.toString());
            const timesG = subset.map(r => r.timeGreedy);
            const timesA = subset.map(r => r.timeAgg);
            const DgArr = subset.map(r => r.DGreedy);
            const DaArr = subset.map(r => r.DAgg);

            // t(n)
            const configTime = {
                type: 'line' as const,
                data: {
                    labels: labelsN,
                    datasets: [
                        {
                            label: 'Жадібний (t)',
                            data: timesG,
                            borderColor: 'rgba(75, 192, 192, 0.9)',
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            fill: false,
                            tension: 0.2,
                            pointRadius: 5
                        },
                        {
                            label: 'Зведений (t)',
                            data: timesA,
                            borderColor: 'rgba(255, 159, 64, 0.9)',
                            backgroundColor: 'rgba(255, 159, 64, 0.5)',
                            fill: false,
                            tension: 0.2,
                            pointRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Час t(n), wMin=${wRange[0]}–wMax=${wRange[1]}, π=${this.finalConfig!.pi}, Δθ=${this.finalConfig!.deltaTheta}`,
                            font: { size: 18 }
                        },
                        legend: { position: 'top' as const }
                    },
                    scales: {
                        x: { title: { display: true, text: 'n' } },
                        y: { title: { display: true, text: 'Час (с)' }, beginAtZero: true }
                    }
                }
            };
            const bufferTime = await canvas.renderToBuffer(configTime);
            fs.writeFileSync(
                path.join(outputDir, `time_vs_n_w${wRange[0]}-${wRange[1]}.png`),
                bufferTime
            );

            // D(n)
            const configD = {
                type: 'line' as const,
                data: {
                    labels: labelsN,
                    datasets: [
                        {
                            label: 'Жадібний (D)',
                            data: DgArr,
                            borderColor: 'rgba(153, 102, 255, 0.9)',
                            backgroundColor: 'rgba(153, 102, 255, 0.5)',
                            fill: false,
                            tension: 0.2,
                            pointRadius: 5
                        },
                        {
                            label: 'Зведений (D)',
                            data: DaArr,
                            borderColor: 'rgba(54, 162, 235, 0.9)',
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            fill: false,
                            tension: 0.2,
                            pointRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `D(n), wMin=${wRange[0]}–wMax=${wRange[1]}, π=${this.finalConfig!.pi}, Δθ=${this.finalConfig!.deltaTheta}`,
                            font: { size: 18 }
                        },
                        legend: { position: 'top' as const }
                    },
                    scales: {
                        x: { title: { display: true, text: 'n' } },
                        y: { title: { display: true, text: 'D' }, beginAtZero: false }
                    }
                }
            };
            const bufferD = await canvas.renderToBuffer(configD);
            fs.writeFileSync(
                path.join(outputDir, `D_vs_n_w${wRange[0]}-${wRange[1]}.png`),
                bufferD
            );
        }
    }
}
