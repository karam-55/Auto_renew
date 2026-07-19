const service = require("/app/dist/modules/telegram/service.js").getTelegramService();
console.log("enabled:", service.isEnabled());
