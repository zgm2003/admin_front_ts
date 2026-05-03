export type CaptchaType = 'slide'

export interface SlideCaptchaAnswer {
  x: number
  y: number
}

export interface SlideCaptchaChallenge {
  captcha_id: string
  captcha_type: CaptchaType
  master_image: string
  tile_image: string
  tile_x: number
  tile_y: number
  tile_width: number
  tile_height: number
  image_width: number
  image_height: number
  expires_in: number
}
