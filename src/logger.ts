export const levelStringSym: unique symbol = Symbol('levelString')
export const levelNumberSym: unique symbol = Symbol('levelNumber')

export type Payload = { [k in PropertyKey]: unknown } & {
  [levelNumberSym]: number
  [levelStringSym]: string
}

export type LevelMapping = { [k in string]: number }

export type LoggerOpts<T extends LevelMapping> = {
  level: keyof T | T[keyof T]
  levels: T
  levelOutput: 'string' | 'number'
  base?: () => object
  fields?: object
  levelKey: string
  messageKey: string
  format: (msg: string, ...args: unknown[]) => string
  transform: (o: object) => object
  fieldTransforms?: { [k in string | number]: (v: unknown, k: string) => unknown }
  output: (s: Payload) => unknown
}

export type ChildOpts<T extends LevelMapping> = Omit<Partial<LoggerOpts<T>>, 'levels' | 'fields'>

const hop = Object.prototype.hasOwnProperty

export class BaseLogger<T extends LevelMapping> {
  levels: T
  level: number = 0
  levelOutput: 'number' | 'string'
  base?: () => object
  fields?: object
  levelKey: string
  messageKey: string
  format: (msg: string, ...args: unknown[]) => string
  transform: (o: object) => object
  fieldTransforms?: { [k in string | number]: (v: unknown, k: string) => unknown }
  output: (s: Payload) => unknown

  constructor(opts: LoggerOpts<T>) {
    this.levels = opts.levels
    this.base = opts.base
    this.fields = opts.fields
    this.levelOutput = opts.levelOutput
    this.levelKey = opts.levelKey
    this.messageKey = opts.messageKey
    this.format = opts.format
    this.output = opts.output
    this.transform = opts.transform
    this.fieldTransforms = opts.fieldTransforms

    this.setLevel(opts.level)

    for (const [strLevel, numLevel] of Object.entries(this.levels)) {
      (this as any)[strLevel] = this._log.bind(this, numLevel, strLevel)
    }
  }

  setLevel(level: keyof T | number) {
    if (typeof level === 'number') {
      this.level = level
    } else {
      if (!hop.call(this.levels, level)) {
        throw new Error(`Unknown level: ${level}`)
      }

      const levelNum = this.levels[level]
      if (typeof levelNum !== 'number') {
        throw new Error(`Unknown level: ${level}`)
      }
      this.level = levelNum
    }
  }

  child(fields: object, opts: ChildOpts<T> = {}): Logger<T> {
    return new BaseLogger({
      level: opts.level ?? this.level,
      levels: this.levels,
      base: opts.base || this.base,
      fields: this.fields
        ? { ...this.fields, ...fields }
        : fields,
      levelOutput: opts.levelOutput || this.levelOutput,
      levelKey: opts.levelKey ?? this.levelKey,
      messageKey: opts.messageKey ?? this.messageKey,
      format: opts.format || this.format,
      output: opts.output || this.output,
      transform: opts.transform || this.transform,
      fieldTransforms: opts.fieldTransforms
        ? this.fieldTransforms
          ? { ...this.fieldTransforms, ...opts.fieldTransforms }
          : opts.fieldTransforms
        : this.fieldTransforms
    } as LoggerOpts<T>) as Logger<T>
  }

  private _log(level: number, levelString: string, obj: object, msg?: string, ...args: unknown[]): void
  private _log(level: number, levelString: string, msg: string, ...args: unknown[]): void
  private _log(level: number, levelString: string, msgOrObj: object | string, ...args: unknown[]): void {
    if (level < this.level) {
      return
    }

    let payload: Payload
    try {
      payload = (this.base ? this.base() : {}) as Payload
    } catch {
      payload = {} as Payload
    }

    payload[this.levelKey] = this.levelOutput === 'string' ? levelString : level

    if (this.fields) {
      Object.assign(payload, this.fields)
    }

    if (typeof msgOrObj === 'string') {
      if (args.length > 0) {
        try {
          payload[this.messageKey] = this.format(msgOrObj, ...args)
        } catch(_) {
          payload[this.messageKey] = [msgOrObj, ...args]
        }
      } else {
        payload[this.messageKey] = msgOrObj
      }
    } else {
      if (msgOrObj !== null && msgOrObj !== undefined) {
        try {
          Object.assign(payload, this.transform(msgOrObj))
        } catch(_) {
          // noop
        }
      }
      if (args.length > 1) {
        try {
          payload[this.messageKey] = this.format(...args as [string, ...unknown[]])
        } catch(_) {
          payload[this.messageKey] = args
        }
      } else if (args.length > 0) {
        payload[this.messageKey] = args[0]
      }
    }

    const ft = this.fieldTransforms
    if (ft) {
      for (const k in payload) {
        if (hop.call(payload, k) && hop.call(ft, k) && typeof ft[k] === 'function') {
          try {
            payload[k] = ft[k].call(this, payload[k], k)
          } catch (_) {
            // noop
          }
        }
      }
    }

    payload[levelStringSym] = levelString
    payload[levelNumberSym] = level

    try {
      this.output(payload)
    } catch(_) {
      // noop
    }
  }
}

export type LogMethods<T extends LevelMapping> = {
  [l in keyof T]:
    ((obj: object, msg?: string, ...args: unknown[]) => void) &
    ((msg: string, ...args: unknown[]) => void)
}

export type Logger<T extends LevelMapping> = BaseLogger<T> & LogMethods<T>
