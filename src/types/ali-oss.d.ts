declare module 'ali-oss' {
  export interface OSSOptions {
    region: string
    bucket?: string
    accessKeyId: string
    accessKeySecret: string
    stsToken?: string
    secure?: boolean
    endpoint?: string
  }

  export default class OSS {
    constructor(options: OSSOptions)
    put(key: string, file: any): Promise<{ url?: string } & any>
  }
}

