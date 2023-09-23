const cron = require("node-cron");
const {CRONE_EXPRESSIONS} = require("./constants");
const {getTime, groupEventsByUserId} = require("./helpers");
const schedule = require("./Schedule");
const {notify} = require("./notifier");

module.exports.runCron = () => {
  cron.schedule(CRONE_EXPRESSIONS.EVERY_MINUTE, async () => {
    const time = getTime();
    const events = schedule.getByTime(time);
    const groupedEventsByUser = groupEventsByUserId(events);
    const stack = [];
    if (groupedEventsByUser.length) {
      stack.push(...groupedEventsByUser);
    }
    while (stack.length) {
      const event = stack.pop();
      const err = await notify({chatId: event[0], message: event[1]});
      if (err) stack.push(event);
    }
    console.log(`Cron job execution. Time - ${time}`);
  });
};
