const TelegramBot = require('node-telegram-bot-api');
const token = 'js4di38sdh3r2s';

const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg, match) => {
    bot.sendMessage(msg.chat.id, 'Начинаю слушать Gmail');
});
