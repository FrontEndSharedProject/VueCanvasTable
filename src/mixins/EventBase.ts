type EventType<T> = {
  [K in keyof T]: (...args: any) => void;
};

export class EventBase<T extends EventType<T>> {
  private eventList: Partial<Record<keyof T, Array<T[keyof T]>>> = {};

  public $on<K extends keyof T>(eventName: K, handler: T[K]) {
    const eventList = this.eventList[eventName];
    if (eventList) {
      eventList.push(handler);
    } else {
      this.eventList[eventName] = [handler];
    }
  }

  public $off<K extends keyof T>(eventName: K, handler: T[K]) {
    const eventList = this.eventList[eventName];
    if (eventList) {
      let index = eventList.indexOf(handler);
      if (~index) {
        eventList.splice(index, 1);
      }
    }
  }

  public $emit<K extends keyof T>(eventName: K, ...payload: Parameters<T[K]>) {
    const eventList = this.eventList[eventName];
    if (eventList) {
      for (let i = 0; i < eventList.length; i++) {
        //  @ts-ignore
        eventList[i].call(null, ...payload);
      }
    }
  }
}
