import { ref, onBeforeUnmount } from 'vue'

export interface WatermarkOptions {
  fontSize?: number
  font?: string
  color?: string
  width?: number
  height?: number
  rotate?: number
  zIndex?: number
}

const domSymbol = Symbol('watermark-dom')

export function useWatermark(appendEl: HTMLElement | null = document.body) {
  let func: () => void = () => {}
  const id = domSymbol.toString()
  const watermarkEl = ref<HTMLElement | null>(null)
  let observer: MutationObserver | null = null

  const clear = () => {
    const domId = document.getElementById(id)
    if (domId) {
      const el = appendEl
      el && el.removeChild(domId)
    }
    window.removeEventListener('resize', func)
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  const createWatermark = (str: string, options: WatermarkOptions = {}) => {
    clear()

    const can = document.createElement('canvas')
    const width = options.width ?? 300
    const height = options.height ?? 240
    can.width = width
    can.height = height

    const cans = can.getContext('2d')
    if (cans) {
      cans.rotate(((options.rotate ?? -20) * Math.PI) / 180)
      cans.font = `${options.fontSize ?? 15}px ${options.font ?? 'Vedana'}`
      cans.fillStyle = options.color ?? 'rgba(0, 0, 0, 0.15)'
      cans.textAlign = 'left'
      cans.textBaseline = 'middle'
      cans.fillText(str, width / 20, height)
    }

    const div = document.createElement('div')
    div.id = id
    div.style.pointerEvents = 'none'
    div.style.top = '0px'
    div.style.left = '0px'
    div.style.position = 'absolute'
    div.style.zIndex = (options.zIndex ?? 100000000).toString()
    div.style.width = document.documentElement.clientWidth + 'px'
    div.style.height = document.documentElement.clientHeight + 'px'
    div.style.background = 'url(' + can.toDataURL('image/png') + ') left top repeat'
    div.style.inset = '0'
    
    const el = appendEl
    if (el) {
      el.appendChild(div)
      watermarkEl.value = div
      
      // AI 增强：防止用户通过控制台删除水印
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const removedNodes = Array.from(mutation.removedNodes)
            if (removedNodes.some((node) => node === div)) {
              // 水印被删除了，重新创建
              createWatermark(str, options)
            }
          }
          if (mutation.type === 'attributes' && mutation.target === div) {
            // 水印属性被修改（如 display: none），重新重置属性或重建
            div.style.display = 'block'
            div.style.visibility = 'visible'
            div.style.opacity = '1'
          }
        })
      })
      
      observer.observe(el, {
        childList: true,
        subtree: false
      })
      
      // 同时也监听 div 本身的属性变化
      observer.observe(div, {
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden']
      })
    }
    
    return id
  }

  function setWatermark(str: string, options?: WatermarkOptions) {
    createWatermark(str, options)
    func = () => {
      createWatermark(str, options)
    }
    window.addEventListener('resize', func)
  }

  onBeforeUnmount(() => {
    clear()
  })

  return { setWatermark, clear }
}
