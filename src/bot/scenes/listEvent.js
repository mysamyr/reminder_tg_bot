const {Scenes, Markup, Composer} = require("telegraf");
const {SCENES, BOT_COMMANDS, ERROR_MESSAGES} = require("../../constants");
const {getTimeBtns, deletePrevMessages, renderMenu, validateTime, getEventBtns} = require("./common");
const schedule = require("../../Schedule");

const startScene = async (ctx) => {
  const list = schedule.getByUser(ctx.update.message.from.id);
  if (!list.length) {
    ctx.reply(
      "You don't have any notification",
      Markup.keyboard([
        [BOT_COMMANDS.ADD, BOT_COMMANDS.EXIT],
      ]).resize()
    );
  } else {
    ctx.wizard.state.msgIds = [];
    const {message_id: id1} = await ctx.reply(
      "Notifications list",
      getTimeBtns(list),
    );
    const {message_id: id2} = await ctx.reply("Please, select time to manage events", Markup.keyboard([
      [BOT_COMMANDS.ADD, BOT_COMMANDS.EXIT],
    ]).resize());
    ctx.wizard.state.msgIds.push(id1, id2);
  }
  return ctx.wizard.next();
};

const step1 = new Composer();
step1.on("text", (ctx) => {
  const input = ctx.update.message.text;
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (input === BOT_COMMANDS.ADD) {
    deletePrevMessages(ctx);
    ctx.scene.leave();
    return ctx.scene.enter(SCENES.ADD_EVENT);
  }
});
step1.on("callback_query", async (ctx) => {
  deletePrevMessages(ctx);
  const time = ctx.update.callback_query.data;
  // todo validation?
  if (!validateTime(time)) {
    ctx.reply(ERROR_MESSAGES.NOT_VALID_TIME);
    return ctx.scene.reenter();
  }
  const events = schedule.getByUserTime(ctx.update.callback_query.from.id, time);
  const {message_id: id1} = await ctx.reply(
    `Your notifications for ${time}`,
    getEventBtns(events),
  );
  const {message_id: id2} = await ctx.reply("Select event to manage it", Markup.keyboard([
    [BOT_COMMANDS.ADD, BOT_COMMANDS.BACK],
  ]).resize());
  ctx.wizard.state.msgIds.push(id1, id2);
  ctx.wizard.state.events = events;

  return ctx.wizard.next();
});

const step2 = new Composer();
step2.on("text", (ctx) => {
  const input = ctx.update.message.text;
  if (input === BOT_COMMANDS.BACK) {
    return ctx.scene.reenter();
  }
  if (input === BOT_COMMANDS.ADD) {
    deletePrevMessages(ctx);
    ctx.scene.leave();
    return ctx.scene.enter(SCENES.ADD_EVENT);
  }
});
step2.on("callback_query", async (ctx) => {
  deletePrevMessages(ctx);
  const eventId = ctx.update.callback_query.data;
  const eventData = schedule.getById(eventId);
  if (!eventData) {
    ctx.reply(ERROR_MESSAGES.EVENT_NOT_EXIST);
    return ctx.scene.reenter();
  }
  // todo add status from user collection
  const status = schedule.getStatus(ctx.update.callback_query.from.id, eventId);
  ctx.reply(
    `Time - ${eventData.time}\nMessage - ${eventData.msg}\nStatus - ${status}`,
    Markup.keyboard([
      [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.CHANGE_MESSAGE, BOT_COMMANDS.CHANGE_STATUS],
      [BOT_COMMANDS.BACK, BOT_COMMANDS.DELETE_EVENT, BOT_COMMANDS.EXIT],
    ]).resize()
  );
  ctx.wizard.state.eventData = eventData;
  ctx.wizard.state.status = status;
  return ctx.wizard.next();
});

const step3 = new Composer();
step3.on("text", async (ctx) => {
  const input = ctx.update.message.text;
  const eventData = ctx.wizard.state.eventData;
  if (input === BOT_COMMANDS.BACK) {
    const events = ctx.wizard.state.events;
    const {message_id: id1} = await ctx.reply(
      `Your notifications for ${eventData.time}`,
      getEventBtns(events),
    );
    const {message_id: id2} = await ctx.reply("Select event to manage it", Markup.keyboard([
      [BOT_COMMANDS.ADD, BOT_COMMANDS.BACK],
    ]).resize());
    ctx.wizard.state.msgIds.push(id1, id2);
    return ctx.wizard.selectStep(2);
  }
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (input === BOT_COMMANDS.CHANGE_TIME) {
    ctx.reply(
      "Enter new time for notification",
      Markup.keyboard([
        [BOT_COMMANDS.BACK],
      ]).resize()
    );
    return ctx.wizard.selectStep(4); // changeTime
  }
  if (input === BOT_COMMANDS.CHANGE_MESSAGE) {
    ctx.reply(
      "Enter new message for notification",
      Markup.keyboard([
        [BOT_COMMANDS.BACK],
      ]).resize()
    );
    return ctx.wizard.selectStep(5); // changeTime
  }
  if (input === BOT_COMMANDS.CHANGE_STATUS) {
    const newStatus = schedule.toggleStatus(ctx.update.message.from.id, eventData.id);
    ctx.reply(
      `Time - ${eventData.time}\nMessage - ${eventData.msg}\nStatus - ${newStatus}`,
      Markup.keyboard([
        [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.CHANGE_MESSAGE, BOT_COMMANDS.CHANGE_STATUS],
        [BOT_COMMANDS.BACK, BOT_COMMANDS.DELETE_EVENT, BOT_COMMANDS.EXIT],
      ]).resize()
    );
    ctx.wizard.state.status = newStatus;
    return;
  }
  if (input === BOT_COMMANDS.DELETE_EVENT) {
    schedule.remove(ctx.update.message.from.id, eventData.id);
    return ctx.scene.reenter();
  }
});

const changeTime = new Composer();
changeTime.on("text", (ctx) => {
  const input = ctx.update.message.text;
  const eventData = ctx.wizard.state.eventData;
  const status = ctx.wizard.state.status;
  if (input === BOT_COMMANDS.BACK) {
    ctx.reply(
      `Time - ${eventData.time}\nMessage - ${eventData.msg}\nStatus - ${status}`,
      Markup.keyboard([
        [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.CHANGE_MESSAGE, BOT_COMMANDS.CHANGE_STATUS],
        [BOT_COMMANDS.BACK, BOT_COMMANDS.DELETE_EVENT, BOT_COMMANDS.EXIT],
      ]).resize()
    );
    return ctx.wizard.selectStep(3);
  }
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (validateTime(input)) {
    // todo handle error
    const newEventData = schedule.editTime(eventData.id, input);
    ctx.wizard.state.eventData = newEventData;
    ctx.reply(
      `Time - ${newEventData.time}\nMessage - ${newEventData.msg}\nStatus - ${status}`,
      Markup.keyboard([
        [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.CHANGE_MESSAGE, BOT_COMMANDS.CHANGE_STATUS],
        [BOT_COMMANDS.BACK, BOT_COMMANDS.DELETE_EVENT, BOT_COMMANDS.EXIT],
      ]).resize()
    );

    return ctx.wizard.selectStep(3);
  }
  ctx.reply(
    "You entered wrong time. Please try again (e.g. 12:34)",
    Markup.keyboard([
      [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
    ]).resize()
  );
});

const changeMsg = new Composer();
changeMsg.on("text", (ctx) => {
  const input = ctx.update.message.text;
  const eventData = ctx.wizard.state.eventData;
  const status = ctx.wizard.state.status;
  if (input === BOT_COMMANDS.BACK) {
    ctx.reply(
      `Time - ${eventData.time}\nMessage - ${eventData.msg}\nStatus - ${status}`,
      Markup.keyboard([
        [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.CHANGE_MESSAGE, BOT_COMMANDS.CHANGE_STATUS],
        [BOT_COMMANDS.BACK, BOT_COMMANDS.DELETE_EVENT, BOT_COMMANDS.EXIT],
      ]).resize()
    );
    return ctx.wizard.selectStep(3);
  }
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (input.length < 100) {
    // todo handle error
    const newEventData = schedule.editMsg(eventData.id, input);
    ctx.wizard.state.eventData = newEventData;
    ctx.reply(
      `Time - ${newEventData.time}\nMessage - ${newEventData.msg}\nStatus - ${status}`,
      Markup.keyboard([
        [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.CHANGE_MESSAGE, BOT_COMMANDS.CHANGE_STATUS],
        [BOT_COMMANDS.BACK, BOT_COMMANDS.DELETE_EVENT, BOT_COMMANDS.EXIT],
      ]).resize()
    );

    return ctx.wizard.selectStep(3);
  }
  ctx.reply(
    "Your message is too long. Provide a smaller message",
    Markup.keyboard([
      [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
    ]).resize()
  );
});

module.exports = new Scenes.WizardScene(
  SCENES.LIST_EVENT,
  (ctx) => startScene(ctx),
  step1,
  step2,
  step3,
  changeTime,
  changeMsg,
);