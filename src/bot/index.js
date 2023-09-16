const {
  Telegraf,
  Scenes,
  session,
} = require("telegraf");
const {message} = require("telegraf/filters");
const {BOT_COMMANDS, SCENES} = require("../constants");
const schedule = require("../Schedule");
const {addEventWizard} = require("./scenes");
const {BOT_TOKEN} = require("../../config");

const bot = new Telegraf(BOT_TOKEN);

module.exports.launchBot = async () => {
  const stage = new Scenes.Stage([addEventWizard]);

  bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const response_time = new Date() - start
    console.log(`(Response Time: ${response_time})`)
  });
  bot.use(session());
  bot.use(stage.middleware());

  bot.hears(BOT_COMMANDS.ADD, async (ctx) => ctx.scene.enter(SCENES.ADD_EVENT));
  bot.hears(BOT_COMMANDS.LIST, async (ctx) => {
    const list = schedule.getAll();
    // todo
    await ctx.reply(JSON.stringify(list));
  });

  bot.start((ctx) => ctx.reply("Welcome"));
  bot.help((ctx) => ctx.reply("Send me a sticker"));
  bot.on(message("sticker"), (ctx) => ctx.reply("👍"));
  bot.hears("hi", (ctx) => ctx.reply("Hey there"));

  await bot.launch();
};
