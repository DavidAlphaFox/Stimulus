import { Binding } from "./binding"
// 直接实现EventListenerObject的相应接口
// connect的时候就是在EventTarget上添加H5的事件
export class EventListener implements EventListenerObject {
  readonly eventTarget: EventTarget
  readonly eventName: string
  private unorderedBindings: Set<Binding>

  constructor(eventTarget: EventTarget, eventName: string) {
    this.eventTarget = eventTarget
    this.eventName = eventName
    this.unorderedBindings = new Set
  }

  connect() {
    this.eventTarget.addEventListener(this.eventName, this, false)
  }

  disconnect() {
    this.eventTarget.removeEventListener(this.eventName, this, false)
  }

    // Binding observer delegate
    // 为当前事件添加一个binding，这样就能做到一个事件对象
    // 上的某个事件可以被多个监听者监听
   
  bindingConnected(binding: Binding) {
    this.unorderedBindings.add(binding)
  }

  bindingDisconnected(binding: Binding) {
    this.unorderedBindings.delete(binding)
  }

  handleEvent(event: Event) {
      // 扩展事件对象，增加immediatePropagationStopped属性
      // 和stopImmediatePropagation的函数
      // 用来结束事件冒泡
      const extendedEvent = extendEvent(event)
      // 遍历所有的binding
      // 使用每个binding处理事件
      for (const binding of this.bindings) {
          if (extendedEvent.immediatePropagationStopped) {
              break
          } else {
              binding.handleEvent(extendedEvent)
          }
      }
  }

  get bindings(): Binding[] {
    return Array.from(this.unorderedBindings).sort((left, right) => {
      const leftIndex = left.index, rightIndex = right.index
      return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0
    })
  }
}

function extendEvent(event: Event) {
  if ("immediatePropagationStopped" in event) {
    return event
  } else {
    const { stopImmediatePropagation } = event
    return Object.assign(event, {
      immediatePropagationStopped: false,
      stopImmediatePropagation() {
        this.immediatePropagationStopped = true
        stopImmediatePropagation.call(this)
      }
    })
  }
}
