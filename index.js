const {launchBot} = require("./src/bot");
const {runCron} = require("./src/cron");

(async () => {
  launchBot();
  runCron();
})();
