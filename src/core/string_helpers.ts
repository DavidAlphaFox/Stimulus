//"remote-url-value" => remoteUrlValue
export function camelize(value: string) {
  return value.replace(/(?:[_-])([a-z0-9])/g, (_, char) => char.toUpperCase())
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
//"remoteUrlValue" => remote-url-value
export function dasherize(value: string) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`)
}

export function tokenize(value: string) {
  return value.match(/[^\s]+/g) || []
}
