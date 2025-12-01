import axios from 'axios'

export const getRondomImage = () =>
  axios.get('https://api.btstu.cn/sjbz/api.php', {
    params: { lx: 'dongman', format: 'json', method: 'pc' },
  })
