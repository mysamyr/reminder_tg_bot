const {Scenes, Composer, Markup} = require("telegraf");
const {SCENES, BOT_COMMANDS} = require("../../constants");
const schedule = require("../../Schedule");
const {validateTime, renderMenu} = require("./common");

const startScene = (ctx) => {
  ctx.reply(
    "Do you want to create new notification or add existing?",
    Markup.keyboard([
      [BOT_COMMANDS.NEW_EVENT, BOT_COMMANDS.ADD_EVENT_BY_ID, BOT_COMMANDS.EXIT],
    ]).resize()
  );
  return ctx.wizard.next();
};

const addNew = new Composer();
addNew.on("text", (ctx) => {
  const input = ctx.update.message.text;
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (input === BOT_COMMANDS.NEW_EVENT) {
    ctx.reply(
      "Enter time for event you want to create in format HH:MM (e.g. 12:34)",
      Markup.keyboard([
        [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
      ]).resize()
    );
    return ctx.wizard.next();
  }
  if (input === BOT_COMMANDS.ADD_EVENT_BY_ID) {
    ctx.reply(
      "Enter event id to add event to your notifications",
      Markup.keyboard([
        [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
      ]).resize()
    );
    return ctx.wizard.selectStep(4);
  }
});

const checkTime = new Composer();
checkTime.on("text", (ctx) => {
  const input = ctx.update.message.text;
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (input === BOT_COMMANDS.BACK) {
    return ctx.scene.reenter();
  }

  if (validateTime(input)) {
    ctx.wizard.state.time = input;
    ctx.reply(
      "Enter message for notification",
      Markup.keyboard([
        [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.EXIT],
      ]).resize()
    );
    return ctx.wizard.next();
  }
  ctx.reply(
    "You entered wrong time. Please try again (e.g. 12:34)",
    Markup.keyboard([
      [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
    ]).resize()
  );
});

const checkMsg = new Composer();
checkMsg.on("text", (ctx) => {
  const input = ctx.update.message.text;
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (input === BOT_COMMANDS.CHANGE_TIME) {
    ctx.reply(
      "Enter time for event you want to create in format HH:MM (e.g. 12:34)",
      Markup.keyboard([
        [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
      ]).resize()
    );
    return ctx.wizard.back();
  }

  if (input.length < 100) {
    const eventData = {
      time: ctx.wizard.state.time,
      msg: input,
    };
    const id = schedule.add(eventData, ctx.update.message.from.id);
    console.log(eventData);
    ctx.reply(
      `Notification ${id} has been added`,
      Markup.keyboard([
        [BOT_COMMANDS.LIST, BOT_COMMANDS.ADD],
      ]).resize()
    );
    return ctx.scene.leave();
  }
  ctx.reply(
    "Your message is too long. Provide smaller message",
    Markup.keyboard([
      [BOT_COMMANDS.CHANGE_TIME, BOT_COMMANDS.EXIT],
    ]).resize()
  );
});

const addExisting = new Composer();
addExisting.on("text", (ctx) => {
  const input = ctx.update.message.text;
  if (input === BOT_COMMANDS.EXIT) {
    renderMenu(ctx);
    return ctx.scene.leave();
  }
  if (input === BOT_COMMANDS.BACK) {
    return ctx.scene.reenter();
  }

  const event = schedule.getById(input);
  if (event) {
    let id;
    try {
      id = schedule.add(event, ctx.update.message.from.id);
    } catch (e) {
      ctx.reply(
        e.message + ". Try again please",
        Markup.keyboard([
          [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
        ]).resize()
      );
      return;
    }
    ctx.reply(
      `Notification ${id} has been added`,
      Markup.keyboard([
        [BOT_COMMANDS.LIST, BOT_COMMANDS.ADD],
      ]).resize()
    );
    return ctx.scene.leave();
  }
  ctx.reply(
    "You entered wrong id. Please try again",
    Markup.keyboard([
      [BOT_COMMANDS.BACK, BOT_COMMANDS.EXIT],
    ]).resize()
  );
});

module.exports = new Scenes.WizardScene(
  SCENES.ADD_EVENT,
  (ctx) => startScene(ctx),
  addNew,
  checkTime,
  checkMsg,
  addExisting,
);


// step1.command(BOT_COMMANDS.ADD, (ctx) => {
//   return ctx.scene.reenter();
// });
// step1.command(BOT_COMMANDS.LIST, async (ctx) => {
//   await ctx.scene.leave();
//   return ctx.scene.enter(SCENES.LIST_EVENT);
// });
// step1.on("callback_query", (ctx) => {
//   const action = ctx.update.callback_query.data;
// });