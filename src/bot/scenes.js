const {Scenes, Markup} = require("telegraf");
const {SCENES, BOT_COMMANDS} = require("../constants");
const schedule = require("../Schedule");

const deletePrevMessage = async (ctx) => {
  const msgId = ctx.wizard.state.msgId;
  if (msgId) {
    await ctx.deleteMessage(msgId);
  }
};
const replyMessage = (msg, buttons = []) => async (ctx) => {
  const {message_id} = await ctx.reply(
    msg,
    Markup.inlineKeyboard(buttons.map(([descr, id]) => Markup.button.callback(descr, id))).resize(),
  );
  return message_id;
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

/*
  0 - welcome
  1 - handle selection
  2 - add new (time)
  3 - add new (msg)
  4 - add existing
*/

module.exports.addEventWizard = new Scenes.WizardScene(SCENES.ADD_EVENT,
  async (ctx) => {
    ctx.wizard.state.msgId = await replyMessage(
      "Do you want to create new notification or add existing?",
      [
        ["Add new", BOT_COMMANDS.NEW_EVENT],
        ["Add existing", BOT_COMMANDS.ADD_EVENT_BY_ID],
        ["Cancel", BOT_COMMANDS.EXIT]
      ]
    )(ctx);
    return ctx.wizard.next();
  },
  async (ctx) => {
    // Expect button input - ignore & delete all typed inputs
    if (ctx.message?.text) {
      await ctx.deleteMessage(ctx.message.message_id);
      return;
    }
    await deletePrevMessage(ctx);
    if (ctx.update.callback_query?.data === BOT_COMMANDS.EXIT) {
      return ctx.scene.leave();
    }
    if (ctx.update.callback_query?.data === BOT_COMMANDS.NEW_EVENT) {
      ctx.wizard.state.msgId = await replyMessage(
        "Enter time for event you want to create in format HH:MM (e.g. 12:34)",
        [
          ["Back", BOT_COMMANDS.BACK],
          ["Cancel", BOT_COMMANDS.EXIT]
        ]
      )(ctx);
      return ctx.wizard.next();
    }
    if (ctx.update.callback_query?.data === BOT_COMMANDS.ADD_EVENT_BY_ID) {
      ctx.wizard.state.msgId = await replyMessage(
        "Enter event id to add event to your notifications",
        [
          ["Back", BOT_COMMANDS.BACK],
          ["Cancel", BOT_COMMANDS.EXIT]
        ]
      )(ctx);
      return ctx.wizard.selectStep(4);
    }
  },
  async (ctx) => {
    await deletePrevMessage(ctx);
    if (ctx.update.callback_query?.data === BOT_COMMANDS.EXIT) {
      return ctx.scene.leave();
    }
    if (ctx.update.callback_query?.data === BOT_COMMANDS.BACK) {
      return ctx.scene.reenter();
    }

    const input = ctx.message.text;
    // some kind of time validation
    if (validateTime(input)) {
      ctx.wizard.state.time = input;
      ctx.wizard.state.msgId = await replyMessage(
        "Enter message for notification",
        [
          ["Edit time", BOT_COMMANDS.CHANGE_TIME],
          ["Cancel", BOT_COMMANDS.EXIT]
        ]
      )(ctx);
      return ctx.wizard.next();
    }
    ctx.wizard.state.msgId = await replyMessage(
      "You entered wrong time. Please try again (e.g. 12:34)",
      [
        ["Back", BOT_COMMANDS.BACK],
        ["Cancel", BOT_COMMANDS.EXIT]
      ]
    )(ctx);
  },
  async (ctx) => {
    await deletePrevMessage(ctx);
    if (ctx.update.callback_query?.data === BOT_COMMANDS.EXIT) {
      return ctx.scene.leave();
    }
    if (ctx.update.callback_query?.data === BOT_COMMANDS.CHANGE_TIME) {
      // go back to time scene
      ctx.wizard.state.msgId = await replyMessage(
        "Enter time for event you want to create in format HH:MM (e.g. 12:34)",
        [
          ["Back", BOT_COMMANDS.BACK],
          ["Cancel", BOT_COMMANDS.EXIT]
        ]
      )(ctx);
      return ctx.wizard.back();
    }
    const input = ctx.message.text;
    // some kind of message validation
    if (input.length < 100) {
      const eventData = {
        time: ctx.wizard.state.time,
        msg: input,
      };
      const id = schedule.add(eventData);
      console.log(eventData);
      await ctx.reply(`Notification ${id} has been added`);
      return ctx.scene.leave();
    }
    ctx.wizard.state.msgId = await replyMessage(
      "Your message is too long. Provide smaller message",
      [
        ["Edit Time", BOT_COMMANDS.CHANGE_TIME],
        ["Cancel", BOT_COMMANDS.EXIT]
      ]
    )(ctx);
  },
  async (ctx) => {
    await deletePrevMessage(ctx);
    if (ctx.update.callback_query?.data === BOT_COMMANDS.EXIT) {
      return ctx.scene.leave();
    }
    if (ctx.update.callback_query?.data === BOT_COMMANDS.BACK) {
      return ctx.scene.reenter();
    }

    // some kind of id validation
    const input = ctx.message.text;
    if (input.length) {
      const event = schedule.getById(input);
      if (event) {
        const id = schedule.add(event, ctx.update.message.from.id);
        await ctx.reply(`Notification ${id} has been added`);
        return ctx.scene.leave();
      }
    }
    ctx.wizard.state.msgId = await replyMessage(
      "You entered wrong id. Please try again",
      [
        ["Back", BOT_COMMANDS.BACK],
        ["Cancel", BOT_COMMANDS.EXIT]
      ]
    )(ctx);
  },
);

module.exports.listEventWizard = new Scenes.WizardScene(SCENES.LIST_EVENT,
  async (ctx) => {
    const list = schedule.getByUser(ctx.update.message.from.id);
    if (!list.length) {
      ctx.wizard.state.msgId = await replyMessage(
        "You don't have any notification",
        [
          ["Add", BOT_COMMANDS.ADD],
          ["Cancel", BOT_COMMANDS.EXIT],
        ]
      )(ctx);
    }
    // todo render list
    return ctx.wizard.next();
  },
  async (ctx) => {
    await deletePrevMessage(ctx);
    if (ctx.update.callback_query?.data === BOT_COMMANDS.ADD) {
      await ctx.scene.leave();
      return ctx.scene.enter(SCENES.ADD_EVENT);
    }
    if (ctx.update.callback_query?.data === BOT_COMMANDS.EXIT) {
      return ctx.scene.leave();
    }
  },
);
