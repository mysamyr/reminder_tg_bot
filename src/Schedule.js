class Schedule {
  constructor() {
    if (this.instance) {
      return this;
    }
    this.events = [];
    this.users = {};
    this.instance = this;
  }

  add(data, userId) {
    const events = [...this.events];
    const users = [...this.users];

    let id = data.id || `${Date.now()}`;
    if (!data.id) {
      events.push({id, usrs: [userId], ...data});
    } else {
      if (users[userId]?.includes(id)) {
        throw new Error("User already has this event");
      }
      const eventId = events.findIndex(e => e.id === id);
      events[eventId].usrs.push(userId);
    }

    users[userId] = this.users[userId] || [];
    users[userId].push(id);

    this.events = events;
    this.users = users;

    return id;
  }

  remove(id, userId) {
    const itemIdx = this.events.findIndex(i => i.id === id);
    if (!this.users[userId].includes(id)) {
      throw new Error("User doesn't have this event");
    }
    if (this.events[itemIdx].usrs.length > 1) {
      this.events[itemIdx].usrs = this.events[itemIdx].usrs.filter(u => u !== userId);
    } else {
      this.events.splice(itemIdx, 1);
    }
    if (this.users[userId].length > 1) {
      this.users[userId] = this.users[userId].filter(e => e !== id);
    } else {
      delete this.users[userId];
    }
    console.log("event removed");
  }

  getById(id) {
    return this.events.find(e => e.id === id);
  }

  getByTime(time) {
    return this.events.filter(e => e.time === time);
  }

  getByUser(userId) {
    const ids = this.users[userId] || [];
    return this.events.filter(e => ids.includes(e.id));
  }
}

module.exports = new Schedule();
