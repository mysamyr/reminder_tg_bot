const {
  Telegraf,
  Scenes,
  session,
} = require("telegraf");
const {message} = require("telegraf/filters");
const {BOT_COMMANDS, SCENES} = require("../constants");
const {addEventWiz, listEventWiz} = require("./scenes");
const {BOT_TOKEN} = require("../../config");
const {renderMenu} = require("./scenes/common");

const bot = new Telegraf(BOT_TOKEN);

module.exports.launchBot = async () => {
  const stage = new Scenes.Stage([addEventWiz, listEventWiz]);

  bot.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const response_time = new Date() - start;
    console.log(`(Response Time: ${response_time})`);
  });
  bot.use(session());
  bot.use(stage.middleware());

  // todo react all scenes to global commands (/start, /stop)

  bot.hears(BOT_COMMANDS.ADD, async (ctx) => ctx.scene.enter(SCENES.ADD_EVENT));
  bot.hears(BOT_COMMANDS.LIST, async (ctx) => ctx.scene.enter(SCENES.LIST_EVENT));

  bot.start((ctx) => renderMenu(ctx));
  bot.command("stop", (ctx) => ctx.reply("You have been unsubscribed from all notifications"));
  bot.help((ctx) => ctx.reply("Send /add to add new notification\nSend /list to show your current notifications"));
  bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
  bot.hears("hi", (ctx) => ctx.reply("Hey there"));

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  bot.launch();
  console.log("Bot launched");
};
