const {Markup} = require("telegraf");
const {BOT_COMMANDS} = require("../../constants");

const deletePrevMessages = (ctx) => {
  const msgIds = ctx.wizard.state.msgIds;
  if (msgIds?.length) {
    msgIds.forEach(id => {
      ctx.deleteMessage(id);
    });
    ctx.wizard.state.msgIds = [];
  }
};

const validateTime = (input) => (
  input.length === 5
  && input[2] === ":"
  && parseInt(input[0]) >= 0
  && parseInt(input[0]) < 3
  && parseInt(input[1]) >= 0
  && parseInt(input[1]) < 10
  && parseInt(input[3]) >= 0
  && parseInt(input[3]) < 6
  && parseInt(input[4]) >= 0
  && parseInt(input[4]) < 10
);

const getTimeBtns = (list) => {
  const eventTimes = list.reduce((acc, item) => {
    acc[item.time] = acc[item.time] ? acc[item.time] + 1 : 1;
    return acc;
  }, {});
  // ["12:34 - 1 event", "t-12:34"]
  return Markup.inlineKeyboard(Object.entries(eventTimes).map(([t, c]) =>
    Markup.button.callback(`${t} - ${c} event${c > 1 ? "s" : ""}`, t))).resize();
};

const getEventBtns = (list) =>
  Markup.inlineKeyboard(list.map(e =>
    Markup.button.callback(e.msg, e.id))).resize();

const renderMenu = (ctx) => {
  ctx.reply(
    "Welcome to the Reminder bot!\nHere you can manage your notifications and receive them on Telegram",
    Markup.keyboard([
      [BOT_COMMANDS.LIST, BOT_COMMANDS.ADD],
    ]).resize()
  );
};

module.exports = {
  deletePrevMessages,
  validateTime,
  getTimeBtns,
  getEventBtns,
  renderMenu,
};
