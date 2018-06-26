import { Application } from "./application"
import { Binding } from "./binding"
import { BindingObserverDelegate } from "./binding_observer"
import { EventListener } from "./event_listener"
//所有的事件都在此处管理
export class Dispatcher implements BindingObserverDelegate {
  readonly application: Application
  private eventListenerMaps: Map<EventTarget, Map<string, EventListener>>
  private started: boolean

  constructor(application: Application) {
    this.application = application
    this.eventListenerMaps = new Map
    this.started = false
  }

  start() {
    if (!this.started) {
      this.started = true
      this.eventListeners.forEach(eventListener => eventListener.connect())
    }
  }

  stop() {
    if (this.started) {
      this.started = false
      this.eventListeners.forEach(eventListener => eventListener.disconnect())
    }
  }

  get eventListeners(): EventListener[] {
    return Array.from(this.eventListenerMaps.values())
      .reduce((listeners, map) => listeners.concat(Array.from(map.values())), [] as EventListener[])
  }

  // Binding observer delegate
  // 每个Controller的Action解析完成了都会在这里进行关联
  bindingConnected(binding: Binding) {
    this.fetchEventListenerForBinding(binding).bindingConnected(binding)
  }

  bindingDisconnected(binding: Binding) {
    this.fetchEventListenerForBinding(binding).bindingDisconnected(binding)
  }

  // Error handling

  handleError(error: Error, message: string, detail: object = {}) {
    this.application.handleError(error, `Error ${message}`, detail)
  }

  private fetchEventListenerForBinding(binding: Binding): EventListener {
    const { eventTarget, eventName } = binding
    return this.fetchEventListener(eventTarget, eventName)
  }

  private fetchEventListener(eventTarget: EventTarget, eventName: string): EventListener {
      // 得到事件所有的监听者
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget)
      // 如果从监听事件Map中得到相应的listener就直接返回
      // 不存在的时候，就直接创建一个全新的listener
      let eventListener = eventListenerMap.get(eventName)
    if (!eventListener) {
      eventListener = this.createEventListener(eventTarget, eventName)
      eventListenerMap.set(eventName, eventListener)
    }
    return eventListener
  }

  private createEventListener(eventTarget: EventTarget, eventName: string): EventListener {
    const eventListener = new EventListener(eventTarget, eventName)
    if (this.started) {
      eventListener.connect()
    }
    return eventListener
  }
    //使用一个两级Map，第一级的Map的key是事件对象
    //第二级的Map的key是事件名
  private fetchEventListenerMapForEventTarget(eventTarget: EventTarget): Map<string, EventListener> {
    let eventListenerMap = this.eventListenerMaps.get(eventTarget)
    if (!eventListenerMap) {
      eventListenerMap = new Map
      this.eventListenerMaps.set(eventTarget, eventListenerMap)
    }
    return eventListenerMap
  }
}
