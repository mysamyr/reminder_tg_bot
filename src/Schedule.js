const {EVENT_STATUSES} = require("./constants");

class Schedule {
  constructor() {
    if (this.instance) {
      return this;
    }
    this.events = [
      // {
      //   id: `${Date.now()}`: string,
      //   usrs: userId[]: number,
      //   time: "12:34": string,
      //   msg: "some text": string
      // }
    ];
    this.users = {
      // userId: number: [{id: eventId: string, status: EVENT_STATUSES.ACTIVE/INACTIVE}]
    };
    this.instance = this;
  }

  add(data, userId) {
    const events = [...this.events];
    const users = {...this.users};

    let id = data.id || `${Date.now()}`;
    if (!data.id) {
      events.push({ ...data, id, usrs: [userId]});
    } else {
      if (users[userId]?.find(e => e.id === id)) {
        throw new Error("User already has this event");
      }
      const eventId = events.findIndex(e => e.id === id);
      events[eventId].usrs.push(userId);
    }

    users[userId] = this.users[userId] || [];
    users[userId].push({id, status: EVENT_STATUSES.ACTIVE});

    this.events = events;
    this.users = users;

    return id;
  }

  remove(userId, eventId) {
    const itemIdx = this.events.findIndex(i => i.id === eventId);
    const userIdx = this.users[userId].findIndex(i => i.id === eventId);
    if (itemIdx < 0) {
      throw new Error("Event doesn't exist");
    }
    if (userIdx < 0) {
      throw new Error("User doesn't have this event");
    }
    if (this.events[itemIdx].usrs.length > 1) {
      this.events[itemIdx].usrs = this.events[itemIdx].usrs.filter(u => u !== userId);
    } else {
      this.events.splice(itemIdx, 1);
    }
    if (this.users[userId].length > 1) {
      this.users[userId] = this.users[userId].filter(e => e !== eventId);
    } else {
      delete this.users[userId];
    }
  }

  editTime(id, newTime) {
    const idx = this.events.findIndex(e => e.id === id);
    this.events[idx] = {...this.events[idx], time: newTime};
    return this.events[idx];
  }

  editMsg(id, newMsg) {
    const idx = this.events.findIndex(e => e.id === id);
    this.events[idx] = {...this.events[idx], msg: newMsg};
    return this.events[idx];
  }

  toggleStatus(userId, eventId) {
    const idx = this.users[userId].findIndex(e => e.id === eventId);
    const newStatus = this.users[userId][idx].status === EVENT_STATUSES.ACTIVE ? EVENT_STATUSES.INACTIVE : EVENT_STATUSES.ACTIVE;
    this.users[userId][idx] = {...this.users[userId][idx], status: newStatus};
    return newStatus;
  }

  unsubscribe(userId) {
    if (this.users[userId]) {
      this.users[userId] = this.users[userId].map(e => ({...e, status: EVENT_STATUSES.INACTIVE}));
    }
  }

  getById(id) {
    return this.events.find(e => e.id === id);
  }

  getByTime(time) {
    return this.events.reduce((acc, e) => {
      if (e.time !== time) return acc;
      const subscribedUsers = e.usrs.filter(u =>
        this.users[u].find(i => i.id === e.id && i.status === EVENT_STATUSES.ACTIVE));
      if (subscribedUsers.length) {
        acc.push({
          ...e,
          usrs: subscribedUsers,
        });
      }
      return acc;
    }, []);
  }

  getByUser(userId) {
    const ids = this.users[userId] ? this.users[userId].map(e => e.id) : [];
    return ids.length ? this.events.filter(e => ids.includes(e.id)) : [];
  }

  getByUserTime(userId, time) {
    const ids = this.users[userId] ? this.users[userId].map(e => e.id) : [];
    return ids.length ? this.events.filter(e => e.time === time && ids.includes(e.id)) : [];
  }

  getStatus(userId, eventId) {
    return this.users[userId].find(e => e.id === eventId)?.status;
  }
}

module.exports = new Schedule();
