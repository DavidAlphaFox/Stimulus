import { ElementObserver, ElementObserverDelegate } from "./element_observer"

export interface AttributeObserverDelegate {
  elementMatchedAttribute?(element: Element, attributeName: string): void
  elementAttributeValueChanged?(element: Element, attributeName: string): void
  elementUnmatchedAttribute?(element: Element, attributeName: string): void
}

export class AttributeObserver implements ElementObserverDelegate {
  attributeName: string
  private delegate: AttributeObserverDelegate

  private elementObserver: ElementObserver

  constructor(element: Element, attributeName: string, delegate: AttributeObserverDelegate) {
    this.attributeName = attributeName
    this.delegate = delegate

    this.elementObserver = new ElementObserver(element, this)
  }

  get element(): Element {
    return this.elementObserver.element
  }

  get selector(): string {
    return `[${this.attributeName}]`
  }

  start() {
    this.elementObserver.start()
  }

  pause(callback: () => void) {
    this.elementObserver.pause(callback)
  }

  stop() {
    this.elementObserver.stop()
  }

  refresh() {
    this.elementObserver.refresh()
  }

  get started(): boolean {
    return this.elementObserver.started
  }

  // Element observer delegate
  // 元素包含对应的属性名（attribute)例如 data-controller
  matchElement(element: Element): boolean {
    return element.hasAttribute(this.attributeName)
  }
  //查找一个节点及其子节点中所有含有对应属性的元素
  matchElementsInTree(tree: Element): Element[] {
    const match = this.matchElement(tree) ? [tree] : []
    const matches = Array.from(tree.querySelectorAll(this.selector))
    return match.concat(matches) // 第一个元素一定是根节点
  }
    // 当新的node加入到DOM当中
  elementMatched(element: Element) {
    if (this.delegate.elementMatchedAttribute) {
      this.delegate.elementMatchedAttribute(element, this.attributeName)
    }
  }

  elementUnmatched(element: Element) {
    if (this.delegate.elementUnmatchedAttribute) {
      this.delegate.elementUnmatchedAttribute(element, this.attributeName)
    }
  }

  elementAttributeChanged(element: Element, attributeName: string) {
    if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
      this.delegate.elementAttributeValueChanged(element, attributeName)
    }
  }
}
