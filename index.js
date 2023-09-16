const {launchBot} = require("./src/bot");
const {runCron} = require("./src/cron");

(async () => {
  await launchBot();
  await runCron();
})();

// notify({chatId: CHAT_ID, title: "TEST", body: "Test message"}).then(res => console.log(res));