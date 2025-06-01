import readline from 'readline';
import chalk from 'chalk';
import { loadOHLCV, updateModel, predictSignal, retrainIfNeeded } from './scripts/predictor.js';
import { executeTrade } from './scripts/trader.js';
import { config } from 'dotenv';
config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const mode = process.env.MODE || await prompt('Pilih mode (monitor/trade): ');
  const pairInput = await prompt('Masukkan pair (cth: btcusdt,ethusdt): ');
  const pairs = pairInput.toLowerCase().split(',').map(p => p.trim());

  console.log(chalk.blue(`
Memulai bot dalam mode: ${mode.toUpperCase()}`));
  rl.close();

  while (true) {
    for (const symbol of pairs) {
      try {
        const ohlcv = await loadOHLCV(symbol);
        const signal = await predictSignal(symbol, ohlcv);
        retrainIfNeeded(symbol);

        let color = chalk.yellow;
        if (signal === 'BUY') color = chalk.green;
        else if (signal === 'SELL') color = chalk.red;

        const time = new Date().toLocaleTimeString();
        console.log(`${time} | ${symbol.toUpperCase()} → ` + color(`[${signal}]`));

        if (mode === 'trade' && signal === 'BUY') {
          await executeTrade(symbol, 'buy', ohlcv);
        } else if (mode === 'trade' && signal === 'SELL') {
          await executeTrade(symbol, 'sell', ohlcv);
        }
      } catch (err) {
        console.error(`Error ${symbol}:`, err.message);
      }
    }
    await new Promise(res => setTimeout(res, 10000)); // delay 10 detik
  }
}

main();
