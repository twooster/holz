export const levelStringSym: unique symbol = Symbol('levelString')
export const levelNumberSym: unique symbol = Symbol('levelNumber')
export const messageSym: unique symbol = Symbol('message')

export type Payload = { [k in PropertyKey]: unknown } & {
  [levelNumberSym]: number
  [levelStringSym]: string
  [messageSym]: string
}

export type LevelMapping = { [k in string]: number }

export type LoggerOpts<T extends LevelMapping> = {
  level: keyof T | T[keyof T]
  levels: T
  numericLevel: boolean
  base?: () => object
  fields?: object
  levelKey: string
  messageKey: string
  preprocess: ProcessFunction
  postprocess: ProcessFunction
  output: (s: Payload) => unknown
}

export type ProcessFunction = (obj: object) => object | void

export type ChildOpts<T extends LevelMapping> = Omit<Partial<LoggerOpts<T>>, 'levels' | 'fields'>

export type LogObj = { [k in string | symbol]: unknown }

const hop = Object.prototype.hasOwnProperty

export class BaseLogger<T extends LevelMapping> {
  levels: T
  level!: number
  numericLevel: boolean
  base?: () => object
  fields?: object
  levelKey: string
  messageKey: string
  preprocess?: ProcessFunction
  postprocess?: ProcessFunction
  output: (s: Payload) => unknown

  constructor(opts: LoggerOpts<T>) {
    this.levels = opts.levels
    this.base = opts.base
    this.fields = opts.fields
    this.numericLevel = opts.numericLevel
    this.levelKey = opts.levelKey
    this.messageKey = opts.messageKey
    this.output = opts.output
    this.preprocess = opts.preprocess
    this.postprocess = opts.postprocess

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
      numericLevel: opts.numericLevel ?? this.numericLevel,
      levelKey: opts.levelKey ?? this.levelKey,
      messageKey: opts.messageKey ?? this.messageKey,
      preprocess: opts.preprocess || this.preprocess,
      postprocess: opts.postprocess || this.postprocess,
      output: opts.output || this.output,
    } as LoggerOpts<T>) as Logger<T>
  }

  private _log(level: number, levelString: string, msg: string, obj?: object): void {
    if (level < this.level) {
      return
    }

    let payload: Payload
    if (this.base) {
      try {
        payload = this.base() as Payload
      } catch {
        payload = {} as Payload
      }
    } else {
      payload = {} as Payload
    }

    if (this.fields) {
      Object.assign(payload, this.fields)
    }

    if (obj) {
      let merge: object | void = obj
      if (this.preprocess) {
        try {
          merge = this.preprocess(obj)
        } catch(_) {
          // noop
        }
      }
      Object.assign(payload, merge)
    }

    payload[this.levelKey] = this.numericLevel ? level : levelString
    payload[this.messageKey] = msg

    if (this.postprocess) {
      try {
        const postprocessed = this.postprocess(payload)
        if (!postprocessed) {
          return
        }
        payload = postprocessed as Payload
      } catch(_) {
        // noop
      }
    }

    payload[levelStringSym] = levelString
    payload[levelNumberSym] = level
    payload[messageSym] = msg

    try {
      this.output(payload)
    } catch(_) {
      // noop
    }
  }
}

type LogMethod = ((msg: string, obj?: object) => void)

export type LogMethods<T extends LevelMapping> = {
  [l in keyof T]: LogMethod
}

export type Logger<T extends LevelMapping> = BaseLogger<T> & LogMethods<T>
