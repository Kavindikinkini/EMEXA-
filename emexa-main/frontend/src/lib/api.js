import { getJSON, postJSON } from '../services/api'

export default {
  get: (path) => getJSON(path),
  post: (path, body) => postJSON(path, body),
}
