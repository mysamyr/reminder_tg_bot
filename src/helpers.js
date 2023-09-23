module.exports.getTime = (date = new Date()) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours > 9 ? hours : "0" + hours}:${minutes > 9 ? minutes : "0" + minutes}`;
};

module.exports.groupEventsByUserId = (events) => {
  const groupedActions = events.reduce((acc, event) => {
    event.usrs.forEach(u => {
      if (!acc[u]) {
        acc[u] = [];
      }
      acc[u].push(event.msg);
    });
    return acc;
  }, {});
  return Object.entries(groupedActions).map(([userId, messages]) => ([userId, messages.join("\n")]));
};

