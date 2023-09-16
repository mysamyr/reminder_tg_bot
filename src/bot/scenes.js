const {Scenes, Markup} = require("telegraf");
const {SCENES, BOT_COMMANDS} = require("../constants");
const schedule = require("../Schedule");

module.exports.addEventWizard = new Scenes.WizardScene(SCENES.ADD_EVENT,
  async (ctx) => {
    const {message_id} = await ctx.reply(
      "Бажаєте додати нове нагадування? Введіть час у форматі HH:MM (12:34)",
      Markup.inlineKeyboard([Markup.button.callback("Скасувати", BOT_COMMANDS.CANCEL_ADD_EVENT)]).resize()
    );
    ctx.wizard.state.eventData = {};
    ctx.wizard.state.msgId = message_id;
    return ctx.wizard.next();
  },
  async (ctx) => {
    const msgId = ctx.wizard.state.msgId;
    await ctx.deleteMessage(msgId);
    if (ctx.update.callback_query?.data === BOT_COMMANDS.CANCEL_ADD_EVENT) {
      return ctx.scene.leave();
    }
    if (ctx.message.text.length !== 5) {
      const {message_id} = await ctx.reply(
        "Невірний формат! Спробуйте знову - Введіть час у форматі HH:MM (12:34)",
        Markup.inlineKeyboard([Markup.button.callback("Скасувати", BOT_COMMANDS.CANCEL_ADD_EVENT)]).resize()
      );
      ctx.wizard.state.msgId = message_id;
      return;
    }
    ctx.wizard.state.eventData.time = ctx.message.text;
    const {message_id} = await ctx.reply(
      "Тепер введіть повідомлення, яке буде відображатись",
      Markup.inlineKeyboard([Markup.button.callback("Скасувати", BOT_COMMANDS.CANCEL_ADD_EVENT)]).resize()
    );

    ctx.wizard.state.msgId = message_id;
    return ctx.wizard.next();
  },
  async (ctx) => {
    const msgId = ctx.wizard.state.msgId;
    await ctx.deleteMessage(msgId);
    if (ctx.update.callback_query?.data === BOT_COMMANDS.CANCEL_ADD_EVENT) {
      return ctx.scene.leave();
    }
    if (ctx.message.text.length < 3) {
      const {message_id} = await ctx.reply(
        "Повідомлення занадто коротке. Введіть повідомлення ще раз",
        Markup.inlineKeyboard([Markup.button.callback("Скасувати", BOT_COMMANDS.CANCEL_ADD_EVENT)]).resize()
      );
      ctx.wizard.state.msgId = message_id;
      return;
    }
    if (ctx.message.text.length > 100) {
      const {message_id} = await ctx.reply(
        "Повідомлення занадто довге. Введіть повідомлення ще раз",
        Markup.inlineKeyboard([Markup.button.callback("Скасувати", BOT_COMMANDS.CANCEL_ADD_EVENT)]).resize()
      );
      ctx.wizard.state.msgId = message_id;
      return;
    }
    ctx.wizard.state.eventData.msg = ctx.message.text;
    // save into schedule
    schedule.add(ctx.wizard.state.eventData);
    console.log(ctx.wizard.state.eventData);
    await ctx.reply("Нове нагадування збережене!");
    return ctx.scene.leave();
  },
);
