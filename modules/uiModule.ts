import * as readlineSync from 'readline-sync';
import { Task } from './dataModule';
import { GreedySolver, AggregateSolver } from './algorithmsModule';
import {
    Experiment,
    PiExperimentConfig,
    ThetaExperimentConfig,
    FinalExperimentConfig
} from './experimentsModule';

export class CLI {
    task?: Task;
    lastSolution?: {
        xLine: number;
        yLine: number;
        Dg: number;
        theta: number;
        Da: number;
    };

    async mainMenu(): Promise<void> {
        while (true) {
            console.log('\n======== ГОЛОВНЕ МЕНЮ ========');
            if (!this.task) console.log('Наразі ІЗ не завантажене чи не згенероване.');
            console.log('1 – Ввести/завантажити/згенерувати ІЗ');
            console.log('2 – Розв\'язати поточне ІЗ');
            console.log('3 – Експеримент 3.4.1 (вплив π)');
            console.log('4 – Експеримент 3.4.2 (вплив Δθ)');
            console.log('5 – Експеримент 3.4.3 (вплив n та Δw)');
            console.log('6 – Вивести поточне ІЗ на екран');
            console.log('7 – Вивести останній розв\'язок');
            console.log('0 – Вийти');
            const choice = readlineSync.question('Ваш вибір: ').trim();

            switch (choice) {
                case '1':
                    this.loadOrGenerateTask();
                    break;
                case '2':
                    this.solveTask();
                    break;
                case '3':
                    await this.runPiExperiment();
                    break;
                case '4':
                    await this.runThetaExperiment();
                    break;
                case '5':
                    await this.runFinalExperiment();
                    break;
                case '6':
                    this.printTask();
                    break;
                case '7':
                    this.printSolution();
                    break;
                case '0':
                    console.log('До побачення!');
                    return;
                default:
                    console.log('Невірний вибір. Спробуйте ще раз.');
            }
        }
    }

    loadOrGenerateTask(): void {
        console.log('\n--- Завантажити або згенерувати ІЗ ---');
        console.log('1 – Ввести вручну');
        console.log('2 – Завантажити з файлу');
        console.log('3 – Згенерувати випадково');
        const c = readlineSync.question('Ваш вибір: ').trim();

        if (c === '1') {
            const n = parseInt(readlineSync.question('n: '), 10);
            const R = parseFloat(readlineSync.question('R: '));
            const pts: { x: number; y: number }[] = [];
            const wts: number[] = [];
            for (let i = 0; i < n; i++) {
                const x = parseFloat(readlineSync.question(`x_${i + 1}: `));
                const y = parseFloat(readlineSync.question(`y_${i + 1}: `));
                const w = parseFloat(readlineSync.question(`w_${i + 1}: `));
                pts.push({ x, y });
                wts.push(w);
            }
            this.task = new Task(n, R, pts, wts);
            console.log('ІЗ успішно введене вручну.');
        } else if (c === '2') {
            const path = readlineSync.question('Шлях до файлу: ').trim();
            try {
                this.task = Task.load(path);
                console.log(`ІЗ завантажено з файлу: ${path}`);
            } catch (e: any) {
                console.error(`Помилка завантаження: ${e.message}`);
            }
        } else if (c === '3') {
            const n = parseInt(readlineSync.question('n: '), 10);
            const R = parseFloat(readlineSync.question('R: '));
            const wMin = parseFloat(readlineSync.question('wMin: '));
            const wMax = parseFloat(readlineSync.question('wMax: '));
            this.task = Task.generate(n, R, wMin, wMax);
            console.log(`ІЗ згенероване (n=${n}, R=${R}, wMin=${wMin}, wMax=${wMax}).`);
        } else {
            console.log('Невірний вибір.');
        }
    }

    solveTask(): void {
        if (!this.task) {
            console.log('Немає ІЗ. Завантажте або згенеруйте (меню 1).');
            return;
        }
        const { xLine, yLine, D: Dg } = GreedySolver.solve(this.task);
        const { theta, D: Da } = AggregateSolver.solve(this.task, 5, Math.PI / 8);
        this.lastSolution = { xLine, yLine, Dg, theta, Da };
        console.log(`\nРезультати розв'язків:`);
        console.log(`Жадібний: x=${xLine.toFixed(2)}, y=${yLine.toFixed(2)}, D=${Dg.toFixed(4)}`);
        console.log(`Зведений: θ=${theta.toFixed(4)}, D=${Da.toFixed(4)}`);
    }

    printTask(): void {
        if (!this.task) {
            console.log('Немає ІЗ.');
            return;
        }
        console.log('\n--- Поточне ІЗ ---');
        console.log(`n = ${this.task.n}, R = ${this.task.R.toFixed(2)}`);
        for (let i = 0; i < this.task.n; i++) {
            const p = this.task.points[i];
            const w = this.task.weights[i];
            console.log(`Точка ${i + 1}: (x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)}), w=${w.toFixed(2)}`);
        }
    }

    printSolution(): void {
        if (!this.lastSolution) {
            console.log('Немає розв\'язку. Виконайте пункт 2.');
            return;
        }
        console.log('\n--- Останній розв\'язок ---');
        const { xLine, yLine, Dg, theta, Da } = this.lastSolution;
        console.log(`Жадібний:  x=${xLine.toFixed(2)}, y=${yLine.toFixed(2)}, D=${Dg.toFixed(4)}`);
        console.log(`Зведений: θ=${theta.toFixed(4)}, D=${Da.toFixed(4)}`);
    }

    async runPiExperiment(): Promise<void> {
        console.log('\n=== Експеримент 3.4.1: Вплив параметра π ===');
        const n = parseInt(readlineSync.question('Фіксоване n: '), 10);
        const deltaTheta = parseFloat(readlineSync.question('Фіксоване Δθ (в рад): '));
        const wMin = parseFloat(readlineSync.question('wMin: '));
        const wMax = parseFloat(readlineSync.question('wMax: '));
        const piInput = readlineSync.question('Значення π через пробіл (напр.: 2 5 10): ');
        const piRange = piInput
            .trim()
            .split(/\s+/)
            .map(x => parseInt(x, 10))
            .filter(x => !isNaN(x));
        const kTasks = parseInt(readlineSync.question('kTasks (кількість ІЗ на π): '), 10);

        const cfg: PiExperimentConfig = { n, deltaTheta, weightRange: [wMin, wMax], piRange, kTasks };
        const exp = new Experiment();
        exp.setPiConfig(cfg);
        console.log('\nЗапускаємо експеримент 3.4.1...');
        exp.runPiExperiments();

        const outDir = readlineSync.question('Папка для результатів (наприклад: pi_results): ');
        console.log('\nЗберігаємо результати...');
        await exp.savePiChartsAndCSV(outDir);
        console.log(`Готово. Файли у папці: ${outDir}`);
    }

    async runThetaExperiment(): Promise<void> {
        console.log('\n=== Експеримент 3.4.2: Вплив кроку Δθ ===');
        const n = parseInt(readlineSync.question('Фіксоване n: '), 10);
        const pi = parseInt(readlineSync.question('Фіксоване π: '), 10);
        const wMin = parseFloat(readlineSync.question('wMin: '));
        const wMax = parseFloat(readlineSync.question('wMax: '));
        const thetaInput = readlineSync.question('Значення Δθ через пробіл (рад; напр.: 1.5708 0.7854 0.3927): ');
        const thetaRange = thetaInput
            .trim()
            .split(/\s+/)
            .map(x => parseFloat(x))
            .filter(x => !isNaN(x));
        const kTasks = parseInt(readlineSync.question('kTasks (кількість ІЗ на Δθ): '), 10);

        const cfg: ThetaExperimentConfig = { n, pi, weightRange: [wMin, wMax], thetaRange, kTasks };
        const exp = new Experiment();
        exp.setThetaConfig(cfg);
        console.log('\nЗапускаємо експеримент 3.4.2...');
        exp.runThetaExperiments();

        const outDir = readlineSync.question('Папка для результатів (наприклад: theta_results): ');
        console.log('\nЗберігаємо результати...');
        await exp.saveThetaChartsAndCSV(outDir);
        console.log(`Готово. Файли у папці: ${outDir}`);
    }

    async runFinalExperiment(): Promise<void> {
        console.log('\n=== Експеримент 3.4.3: Вплив n та Δw ===');
        const nMin = parseInt(readlineSync.question('n від: '), 10);
        const nMax = parseInt(readlineSync.question('n до: '), 10);
        const nStep = parseInt(readlineSync.question('Крок n: '), 10);
        const wRangesInput = readlineSync.question(
            'Введіть пари wMin–wMax через кому (наприклад: 1 3; 3 5; 5 10): '
        );
        const weightRanges = wRangesInput
            .trim()
            .split(';')
            .map(pair => {
                const [a, b] = pair.trim().split(/\s+/).map(x => parseFloat(x));
                return [a, b] as [number, number];
            })
            .filter(pr => pr.length === 2 && !isNaN(pr[0]) && !isNaN(pr[1]));
        const pi = parseInt(readlineSync.question('Оптимальне π (з 3.4.1): '), 10);
        const deltaTheta = parseFloat(readlineSync.question('Оптимальний Δθ (з 3.4.2, рад): '));
        const kTasks = parseInt(readlineSync.question('kTasks (ІЗ на кожну пару): '), 10);

        const cfg: FinalExperimentConfig = {
            nRange: [nMin, nMax, nStep],
            weightRanges,
            pi,
            deltaTheta,
            kTasks
        };
        const exp = new Experiment();
        exp.setFinalConfig(cfg);
        console.log('\nЗапускаємо експеримент 3.4.3...');
        exp.runFinalExperiments();

        const outDir = readlineSync.question('Папка для результатів (наприклад: final_results): ');
        console.log('\nЗберігаємо результати...');
        await exp.saveFinalChartsAndCSV(outDir);
        console.log(`Готово. Файли у папці: ${outDir}`);
    }
}
