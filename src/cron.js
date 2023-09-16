const cron = require("node-cron");
const {CRONE_EXPRESSIONS} = require("./constants");
const {getTime} = require("./helpers");
const schedule = require("./Schedule");
const {notify} = require("./notifier");
const {CHAT_ID} = require("../config");

module.exports.runCron = () => {
  cron.schedule(CRONE_EXPRESSIONS.EVERY_MINUTE, async () => {
    const time = getTime();
    const actions = schedule.getByTime(time);
    const stack = [];
    if (actions.length) {
      stack.push(...actions);
    }
    while (stack.length) {
      const action = stack.pop();
      const err = await notify({chatId: CHAT_ID, title: action.title, body: action.msg});
      if (err) stack.push(action);
    }
    console.log(`Cron job execution. Time - ${time}`);
  });
};
