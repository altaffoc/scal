import axios from 'axios';
import { SMA, RSI, MACD } from 'technicalindicators';
import fs from 'fs';

export async function loadOHLCV(symbol) {
  const res = await axios.get(`https://api.mexc.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1m&limit=100`);
  const ohlcv = res.data.map(d => ({
    time: d[0], open: parseFloat(d[1]), high: parseFloat(d[2]),
    low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5])
  }));
  fs.writeFileSync(`data/ohlcv/${symbol}.json`, JSON.stringify(ohlcv));
  return ohlcv;
}

export function predictSignal(symbol, ohlcv) {
  const closes = ohlcv.map(c => c.close);
  const rsi = RSI.calculate({ period: 14, values: closes });
  const smaShort = SMA.calculate({ period: 5, values: closes });
  const smaLong = SMA.calculate({ period: 20, values: closes });

  const lastRSI = rsi.at(-1) || 50;
  const lastSMA5 = smaShort.at(-1) || closes.at(-1);
  const lastSMA20 = smaLong.at(-1) || closes.at(-1);

  const lastPrice = closes.at(-1);
  let signal = 'HOLD';

  if (lastRSI < 30 && lastSMA5 > lastSMA20) signal = 'BUY';
  else if (lastRSI > 70 && lastSMA5 < lastSMA20) signal = 'SELL';

  fs.appendFileSync(`data/logs/${symbol}.log`, `${Date.now()},${signal}\n`);
  return signal;
}

export function retrainIfNeeded(symbol) {
  // Dummy retrain if imbalance > threshold
  const logPath = `data/logs/${symbol}.log`;
  if (!fs.existsSync(logPath)) return;

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-50);
  const stats = { BUY: 0, SELL: 0, HOLD: 0 };
  lines.forEach(l => stats[l.split(',')[1]]++);

  const imbalance = Math.abs(stats.BUY - stats.SELL);
  if (imbalance > 30) {
    // Panggil retrain model
    fs.writeFileSync(`models/${symbol}_model.json`, JSON.stringify({ retrained: true, time: Date.now() }));
  }
}
