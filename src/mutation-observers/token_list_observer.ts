import { AttributeObserver, AttributeObserverDelegate } from "./attribute_observer"
import { Multimap } from "../multimap"

export interface Token {
  element: Element
  attributeName: string
  index: number
  content: string
}

export interface TokenListObserverDelegate {
  tokenMatched(token: Token): void
  tokenUnmatched(token: Token): void
}

export class TokenListObserver implements AttributeObserverDelegate {
  private attributeObserver: AttributeObserver
  private delegate: TokenListObserverDelegate
  private tokensByElement: Multimap<Element, Token>

  constructor(element: Element, attributeName: string, delegate: TokenListObserverDelegate) {
    this.attributeObserver = new AttributeObserver(element, attributeName, this)
    this.delegate = delegate
    this.tokensByElement = new Multimap()
  }

  get started(): boolean {
    return this.attributeObserver.started
  }

  start() {
    this.attributeObserver.start()
  }

  pause(callback: () => void) {
    this.attributeObserver.pause(callback)
  }

  stop() {
    this.attributeObserver.stop()
  }

  refresh() {
    this.attributeObserver.refresh()
  }

  get element(): Element {
    return this.attributeObserver.element
  }

  get attributeName(): string {
    return this.attributeObserver.attributeName
  }

  // Attribute observer delegate
  // 匹配element
  elementMatchedAttribute(element: Element) {
    this.tokensMatched(this.readTokensForElement(element))
  }
  //当元素的上的属性发生了变化，需要对其进行相应的建立关系和解除关系
  elementAttributeValueChanged(element: Element) {
    const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element)
    this.tokensUnmatched(unmatchedTokens)
    this.tokensMatched(matchedTokens)
  }

  elementUnmatchedAttribute(element: Element) {
    this.tokensUnmatched(this.tokensByElement.getValuesForKey(element))
  }
  // 调用delegate来进一步处理
  private tokensMatched(tokens: Token[]) {
    tokens.forEach((token) => this.tokenMatched(token))
  }

  private tokensUnmatched(tokens: Token[]) {
    tokens.forEach((token) => this.tokenUnmatched(token))
  }

  private tokenMatched(token: Token) {
    this.delegate.tokenMatched(token)
    this.tokensByElement.add(token.element, token)
  }

  private tokenUnmatched(token: Token) {
    this.delegate.tokenUnmatched(token)
    this.tokensByElement.delete(token.element, token) //从tokens列表中删除
  }

  private refreshTokensForElement(element: Element): [Token[], Token[]] {
    const previousTokens = this.tokensByElement.getValuesForKey(element)
    const currentTokens = this.readTokensForElement(element)
    const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(
      ([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken)
    )//找到第一个内容不同的数组index

    if (firstDifferingIndex == -1) {
      return [[], []] //全都相同
    } else {
      return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)]
    }
  }
  //在指定的element找到了特定的atrribute(data-controller，data-action等)
  private readTokensForElement(element: Element): Token[] {
    const attributeName = this.attributeName
    const tokenString = element.getAttribute(attributeName) || ""
    return parseTokenString(tokenString, element, attributeName)
  }
}

function parseTokenString(tokenString: string, element: Element, attributeName: string): Token[] {
  return tokenString
    .trim()
    .split(/\s+/) //空格是分割符号
    .filter((content) => content.length)
    .map((content, index) => ({ element, attributeName, content, index }))
}

function zip<L, R>(left: L[], right: R[]): [L | undefined, R | undefined][] {
  const length = Math.max(left.length, right.length)
  return Array.from({ length }, (_, index) => [left[index], right[index]] as [L, R])
}

function tokensAreEqual(left?: Token, right?: Token) {
  return left && right && left.index == right.index && left.content == right.content
}
