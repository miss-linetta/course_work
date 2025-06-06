import { CLI } from './modules/uiModule';

async function main(): Promise<void> {
    try {
        const cli = new CLI();
        await cli.mainMenu();
    } catch (e: any) {
        console.error('Невідома помилка:', e.message);
    }
}

main();
