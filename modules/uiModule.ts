import * as readlineSync from 'readline-sync';
import { Task } from './dataModule';
import { GreedySolver, AggregateSolver } from './algorithmsModule';
import { Experiment, ExperimentConfig } from './experimentsModule';

export class CLI {
    task?: Task;
    lastSolution?: { xLine: number; yLine: number; Dg: number; theta: number; Da: number };

    mainMenu(): void {
        while (true) {
            console.log('\n--------');
            console.log('Головне меню');
            if (!this.task) console.log('Немає даних.');
            console.log('1 – Ввести/завантажити ІЗ');
            console.log('2 – Розв\'язати ІЗ');
            console.log('3 – Провести експерименти');
            console.log('4 – Вивести дані ІЗ');
            console.log('5 – Вивести розв\'язки');
            console.log('0 – Вийти');
            const choice = readlineSync.question('Ваш вибір: ');
            if (choice === '1') this.loadTask();
            else if (choice === '2') this.solveTask();
            else if (choice === '3') this.runExperiments();
            else if (choice === '4') this.printTask();
            else if (choice === '5') this.printSolution();
            else if (choice === '0') break;
        }
    }

    loadTask(): void {
        console.log('1 – Ввести вручну');
        console.log('2 – Завантажити з файлу');
        console.log('3 – Згенерувати випадково');
        const c = readlineSync.question('Ваш вибір: ');
        if (c === '1') {
            const n = parseInt(readlineSync.question('n: '), 10);
            const R = parseFloat(readlineSync.question('R: '));
            const pts = [];
            const wts = [];
            for (let i = 0; i < n; i++) {
                const x = parseFloat(readlineSync.question(`x_${i+1}: `));
                const y = parseFloat(readlineSync.question(`y_${i+1}: `));
                const w = parseFloat(readlineSync.question(`w_${i+1}: `));
                pts.push({ x, y });
                wts.push(w);
            }
            this.task = new Task(n, R, pts, wts);
        } else if (c === '2') {
            const path = readlineSync.question('Шлях до файлу: ');
            this.task = Task.load(path);
        } else if (c === '3') {
            const n = parseInt(readlineSync.question('n: '), 10);
            const R = parseFloat(readlineSync.question('R: '));
            const wMin = parseFloat(readlineSync.question('w_min: '));
            const wMax = parseFloat(readlineSync.question('w_max: '));
            this.task = Task.generate(n, R, wMin, wMax);
        }
    }

    solveTask(): void {
        if (!this.task) {
            console.log('Немає ІЗ.');
            return;
        }
        const { xLine, yLine, D: Dg } = GreedySolver.solve(this.task);
        const { theta, D: Da } = AggregateSolver.solve(this.task);
        this.lastSolution = { xLine, yLine, Dg, theta, Da };
        console.log(`Жадібний: x=${xLine.toFixed(2)}, y=${yLine.toFixed(2)}, D=${Dg.toFixed(2)}`);
        console.log(`Зведений: θ=${theta.toFixed(2)}, D=${Da.toFixed(2)}`);
    }

    printTask(): void {
        if (!this.task) return console.log('Немає ІЗ.');
        const task = this.task;
        console.log(`n=${task.n}, R=${task.R}`);
        task.points.forEach((p, i) =>
            console.log(`(${p.x.toFixed(2)}, ${p.y.toFixed(2)}), w=${task.weights[i].toFixed(2)}`)
        );
    }


    printSolution(): void {
        if (!this.lastSolution) return console.log('Немає розв\'язку.');
        const { xLine, yLine, Dg, theta, Da } = this.lastSolution;
        console.log(`Розв\'язок жадібного: x=${xLine.toFixed(2)}, y=${yLine.toFixed(2)}, D=${Dg.toFixed(2)}`);
        console.log(`Розв\'язок зведеного: θ=${theta.toFixed(2)}, D=${Da.toFixed(2)}`);
    }

    runExperiments(): void {
        const nMin = parseInt(readlineSync.question('n від: '), 10);
        const nMax = parseInt(readlineSync.question('n до: '), 10);
        const step = parseInt(readlineSync.question('крок: '), 10);
        const kTasks = parseInt(readlineSync.question('Кількість ІЗ на крок: '), 10);
        const pis = readlineSync.question('π (через пробіл): ').split(' ').map(Number);
        const cfg: ExperimentConfig = { nRange: [nMin, nMax, step], kTasks, piRange: pis };
        const exp = new Experiment(cfg);
        exp.run();
        const path = readlineSync.question('Зберегти CSV (шлях): ');
        exp.saveCSV(path);
    }
}