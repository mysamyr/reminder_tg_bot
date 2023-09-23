// const {EOL} = require("os");
const axios = require("axios");
const {ERROR_MESSAGES} = require("./constants");
const {BOT_TOKEN} = require("../config");

const getUrl = (chatId) => `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=`;

module.exports.notify = async ({chatId, message}) => {
  try {
    await axios.get(getUrl(chatId) + encodeURIComponent(message));
  } catch (e) {
    console.log(e);
    return ERROR_MESSAGES.REQUEST_FAILURE;
  }
};
