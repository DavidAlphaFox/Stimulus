import { ErrorHandler } from "./error_handler"
import { Schema } from "./schema"
import { Scope } from "./scope"
import { Token, ValueListObserver, ValueListObserverDelegate } from "../mutation-observers"

export interface ScopeObserverDelegate extends ErrorHandler {
  createScopeForElementAndIdentifier(element: Element, identifier: string): Scope
  scopeConnected(scope: Scope): void
  scopeDisconnected(scope: Scope): void
}

export class ScopeObserver implements ValueListObserverDelegate<Scope> {
  readonly element: Element
  readonly schema: Schema
  private delegate: ScopeObserverDelegate
  private valueListObserver: ValueListObserver<Scope>
  private scopesByIdentifierByElement: WeakMap<Element, Map<string, Scope>>
  private scopeReferenceCounts: WeakMap<Scope, number>
  //传入data-controller这个attribute，让ValueListObserver来关注
  constructor(element: Element, schema: Schema, delegate: ScopeObserverDelegate) {
    this.element = element
    this.schema = schema
    this.delegate = delegate
    this.valueListObserver = new ValueListObserver(this.element, this.controllerAttribute, this)
    this.scopesByIdentifierByElement = new WeakMap()
    this.scopeReferenceCounts = new WeakMap()
  }

  start() {
    this.valueListObserver.start()
  }

  stop() {
    this.valueListObserver.stop()
  }
  //默认是data-controller
  get controllerAttribute() {
    return this.schema.controllerAttribute
  }

  // Value observer delegate

  parseValueForToken(token: Token): Scope | undefined {
    const { element, content: identifier } = token // content 是 controller的逻辑名称
    const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element) 
    // 创建一个map来保存element上controller和scope的关系，也就是说一个element上可以附加多个controller
    let scope = scopesByIdentifier.get(identifier) //从identifier到实体对象映射的表中，找出scope
    if (!scope) {
      scope = this.delegate.createScopeForElementAndIdentifier(element, identifier)
      scopesByIdentifier.set(identifier, scope)
    }

    return scope
  }
  //因为scope是通过上层的createScopeForElementAndIdentifier创建的，
  //其中包含了element,所以同一个controller的scope是存在多个实例的
  elementMatchedValue(element: Element, value: Scope) {
    const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1
    this.scopeReferenceCounts.set(value, referenceCount)
    if (referenceCount == 1) {
      this.delegate.scopeConnected(value)  
    }
  }

  elementUnmatchedValue(element: Element, value: Scope) {
    const referenceCount = this.scopeReferenceCounts.get(value)
    if (referenceCount) {
      this.scopeReferenceCounts.set(value, referenceCount - 1)
      if (referenceCount == 1) {
        this.delegate.scopeDisconnected(value)
      }
    }
  }

  private fetchScopesByIdentifierForElement(element: Element) {
    let scopesByIdentifier = this.scopesByIdentifierByElement.get(element)
    if (!scopesByIdentifier) {//如果没有找到对应的identifier
      scopesByIdentifier = new Map() //创建一个identifier
      this.scopesByIdentifierByElement.set(element, scopesByIdentifier)
    }
    return scopesByIdentifier
  }
}
