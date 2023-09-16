class Schedule {
  constructor() {
    if (this.instance) {
      return this;
    }
    this.list = {};
    this.instance = this;
  }

  add({time, msg}) {
    if (!this.list[time]) {
      this.list[time] = [];
    }
    this.list[time].push({id: `${Date.now()}`, title: "Нагадування", msg});
    console.log("event added");
  }

  remove(time, id) {
    const itemIdx = this.list[time].findIndex(i => i.id === id);
    this.list[time] = this.list[time].splice(itemIdx, 1);
    console.log("event removed");
  }

  getByTime(time) {
    return this.list[time] || [];
  }

  getAll() {
    return Object.entries(this.list).reduce((acc, [time, actions]) => {
      acc.push({time, ...actions});
      return acc;
    }, []);
  }
}

module.exports = new Schedule();