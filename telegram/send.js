// telegram/send.js — FIAT‑PRO CHANNELS

import axios from "axios";

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegram({
  bot,
  symbol,
  timeframe,
  signalType,
  color,
  entry,
  tp,
  sl
}) {
  const text =
    `📡 ${bot}\n` +
    `🔹 ${symbol} (${timeframe})\n` +
    `🔸 ${signalType}\n` +
    `🎨 ${color}\n\n` +
    `💠 Entry: ${entry}\n` +
    `🎯 TP: ${tp}\n` +
    `🛑 SL: ${sl}`;

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text
  });
}
