export interface ElementObserverDelegate {
  matchElement(element: Element): boolean
  matchElementsInTree(tree: Element): Element[]

  elementMatched?(element: Element): void
  elementUnmatched?(element: Element): void
  elementAttributeChanged?(element: Element, attributeName: string): void
}

export class ElementObserver {
  element: Element
  started: boolean
  private delegate: ElementObserverDelegate

  private elements: Set<Element>
  private mutationObserver: MutationObserver
  private mutationObserverInit = { attributes: true, childList: true, subtree: true }
  //元素观察者
  constructor(element: Element, delegate: ElementObserverDelegate) {
    this.element = element
    this.started = false
    this.delegate = delegate

    this.elements = new Set() // 元素列表
    this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations)) 
    //MutationObserver接口提供了监视对 DOM 树所做更改的能力，该功能是 DOM3 Events 规范的一部分。
  }

  start() {
    if (!this.started) {
      this.started = true
      this.mutationObserver.observe(this.element, this.mutationObserverInit)
      this.refresh()
    }
  }

  pause(callback: () => void) {
    if (this.started) {
      this.mutationObserver.disconnect()
      this.started = false
    }

    callback()

    if (!this.started) {
      this.mutationObserver.observe(this.element, this.mutationObserverInit)
      this.started = true
    }
  }

  stop() {
    if (this.started) {
      this.mutationObserver.takeRecords()
      this.mutationObserver.disconnect()
      this.started = false
    }
  }

  refresh() {
    if (this.started) {
      const matches = new Set(this.matchElementsInTree())

      for (const element of Array.from(this.elements)) {
        if (!matches.has(element)) {
          this.removeElement(element)
        }
      }

      for (const element of Array.from(matches)) {
        this.addElement(element)
      }
    }
  }

  // Mutation record processing
  // 处理DOM的变化
  private processMutations(mutations: MutationRecord[]) {
    if (this.started) {
      for (const mutation of mutations) {
        this.processMutation(mutation)
      }
    }
  }
// 处理H5当中的 MutationRecord
  private processMutation(mutation: MutationRecord) {
    if (mutation.type == "attributes") { // 节点属性发生了变化
      this.processAttributeChange(mutation.target, mutation.attributeName!) 
    } else if (mutation.type == "childList") { //DOM的子节点发生了变化
      this.processRemovedNodes(mutation.removedNodes)
      this.processAddedNodes(mutation.addedNodes)
    }
  }
  //处理元素的属性值变化
  private processAttributeChange(node: Node, attributeName: string) {
    const element = node as Element
    if (this.elements.has(element)) { // 如果我们的elements中存有element
      if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
        this.delegate.elementAttributeChanged(element, attributeName) //如果delegate支持元素属性变化，并且是匹配的元素就执行此处
      } else {
        this.removeElement(element) //从元素列别中删除此元素
      }
    } else if (this.matchElement(element)) {//不存在但是可以匹配
      this.addElement(element) //加入元素列列表
    }
  }

  private processRemovedNodes(nodes: NodeList) {
    for (const node of Array.from(nodes)) {
      const element = this.elementFromNode(node)
      if (element) {
        this.processTree(element, this.removeElement)
      }
    }
  }

  private processAddedNodes(nodes: NodeList) {
    for (const node of Array.from(nodes)) {
      const element = this.elementFromNode(node)
      if (element && this.elementIsActive(element)) {
        this.processTree(element, this.addElement)
      }
    }
  }

  // Element matching

  private matchElement(element: Element): boolean {
    return this.delegate.matchElement(element)
  }

  private matchElementsInTree(tree: Element = this.element): Element[] {
    return this.delegate.matchElementsInTree(tree)
  }

  private processTree(tree: Element, processor: (element: Element) => void) {
    for (const element of this.matchElementsInTree(tree)) {
      processor.call(this, element)
    }
  }

  private elementFromNode(node: Node): Element | undefined {
    if (node.nodeType == Node.ELEMENT_NODE) {
      return node as Element
    }
  }

  private elementIsActive(element: Element): boolean {
    if (element.isConnected != this.element.isConnected) {
      return false
    } else {
      return this.element.contains(element)
    }
  }

  // Element tracking
 // 添加一个全新的节点，会调用delegate进行处理
  private addElement(element: Element) {
    if (!this.elements.has(element)) {
      if (this.elementIsActive(element)) {
        this.elements.add(element)
        if (this.delegate.elementMatched) {
          this.delegate.elementMatched(element)
        }
      }
    }
  }

  private removeElement(element: Element) {
    if (this.elements.has(element)) {
      this.elements.delete(element)
      if (this.delegate.elementUnmatched) {
        this.delegate.elementUnmatched(element)
      }
    }
  }
}
