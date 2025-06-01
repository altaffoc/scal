import axios from 'axios';
import crypto from 'crypto';

export async function executeTrade(symbol, side, ohlcv) {
  const { API_KEY, API_SECRET } = process.env;
  const baseUrl = 'https://api.mexc.com';

  const price = ohlcv.at(-1).close;
  const quantity = (10 / price).toFixed(4); // $10 order

  const timestamp = Date.now();
  const query = `symbol=${symbol.toUpperCase()}&side=${side.toUpperCase()}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;
  const signature = crypto.createHmac('sha256', API_SECRET).update(query).digest('hex');

  const url = `${baseUrl}/api/v3/order?${query}&signature=${signature}`;
  const res = await axios.post(url, null, {
    headers: { 'X-MEXC-APIKEY': API_KEY }
  });

  console.log(`Executed ${side.toUpperCase()} order on ${symbol.toUpperCase()} @ ${price}`);
}
