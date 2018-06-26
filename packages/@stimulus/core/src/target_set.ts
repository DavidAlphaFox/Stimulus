import { Schema } from "./schema"
import { Scope } from "./scope"
import { attributeValueContainsToken } from "./selectors"

export class TargetSet {
  readonly scope: Scope

  constructor(scope: Scope) {
    this.scope = scope
  }

  get element(): Element {
    return this.scope.element
  }

  get identifier(): string {
    return this.scope.identifier
  }

  get schema(): Schema {
    return this.scope.schema
  }

  has(targetName: string): boolean {
    return this.find(targetName) != null
  }

  find(...targetNames: string[]): Element | undefined {
    const selector = this.getSelectorForTargetNames(targetNames)
    return this.scope.findElement(selector)
  }

  findAll(...targetNames: string[]): Element[] {
    const selector = this.getSelectorForTargetNames(targetNames)
    return this.scope.findAllElements(selector)
  }
  // 构建target的HTML5的selector
  private getSelectorForTargetNames(targetNames: string[]): string {
    return targetNames.map(targetName => this.getSelectorForTargetName(targetName)).join(", ")
  }

  private getSelectorForTargetName(targetName: string): string {
    const targetDescriptor = `${this.identifier}.${targetName}`
    return attributeValueContainsToken(this.schema.targetAttribute, targetDescriptor)
  }
}
