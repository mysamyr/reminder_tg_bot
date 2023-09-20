const {launchBot} = require("./src/bot");
const {runCron} = require("./src/cron");

(async () => {
  launchBot();
  // runCron();
})();

// notify({chatId: CHAT_ID, body: "Test message"}).then(res => console.log(res));