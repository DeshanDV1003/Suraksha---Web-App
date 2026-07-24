import * as dotenv from 'dotenv';
dotenv.config();

import { sendTelegramTestMessage } from './src/services/telegram-alert';

async function run() {
  console.log("Testing Telegram alert...");
  const success = await sendTelegramTestMessage();
  console.log("Success:", success);
}

run();
