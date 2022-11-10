import { Binding } from "./binding"
// 直接实现EventListenerObject的相应接口
// connect的时候就是在EventTarget上添加H5的事件
export class EventListener implements EventListenerObject {
  readonly eventTarget: EventTarget
  readonly eventName: string
  readonly eventOptions: AddEventListenerOptions
  private unorderedBindings: Set<Binding>

  constructor(eventTarget: EventTarget, eventName: string, eventOptions: AddEventListenerOptions) {
    this.eventTarget = eventTarget
    this.eventName = eventName
    this.eventOptions = eventOptions
    this.unorderedBindings = new Set()
  }

  connect() {
    this.eventTarget.addEventListener(this.eventName, this, this.eventOptions)
  }

  disconnect() {
    this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions)
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
    // FIXME: Determine why TS won't recognize that the extended event has immediatePropagationStopped
    const extendedEvent = extendEvent(event) as any
    for (const binding of this.bindings) {
      if (extendedEvent.immediatePropagationStopped) {
        break
      } else {
        binding.handleEvent(extendedEvent)
      }
  }

  hasBindings() {
    return this.unorderedBindings.size > 0
  }

  get bindings(): Binding[] {
    return Array.from(this.unorderedBindings).sort((left, right) => {
      const leftIndex = left.index,
        rightIndex = right.index
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
      },
    })
  }
}
