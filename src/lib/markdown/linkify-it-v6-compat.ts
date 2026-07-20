import { LinkifyIt } from 'linkify-it-v6-source'

export default class LinkifyItV5Compat extends LinkifyIt {
  pretest(text: string): boolean {
    return this.test(text)
  }
}
