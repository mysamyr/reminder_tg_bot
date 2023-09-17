const {
  Telegraf,
  Scenes,
  session,
} = require("telegraf");
const {message} = require("telegraf/filters");
const {BOT_COMMANDS, SCENES} = require("../constants");
const {addEventWizard, listEventWizard} = require("./scenes");
const {BOT_TOKEN} = require("../../config");

const bot = new Telegraf(BOT_TOKEN);

module.exports.launchBot = async () => {
  const stage = new Scenes.Stage([addEventWizard, listEventWizard]);

  bot.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const response_time = new Date() - start;
    console.log(`(Response Time: ${response_time})`);
  });
  bot.use(session());
  bot.use(stage.middleware());

  bot.hears(BOT_COMMANDS.ADD, async (ctx) => ctx.scene.enter(SCENES.ADD_EVENT));
  bot.hears(BOT_COMMANDS.LIST, async (ctx) => ctx.scene.enter(SCENES.LIST_EVENT));

  bot.start((ctx) => ctx.reply("Welcome to the Reminder bot!\nHere you can manage your notifications and receive them on Telegram"));
  // bot.hears("/status", (ctx) => ctx.reply("You has been unsubscribed from all notifications"));
  bot.hears("/stop", (ctx) => ctx.reply("You has been unsubscribed from all notifications"));
  bot.help((ctx) => ctx.reply("Send /add to add new notification\nSend /list to show your current notifications"));
  bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
  bot.hears("hi", (ctx) => ctx.reply("Hey there"));

  await bot.launch();
};
