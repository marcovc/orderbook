
import * as d3 from 'd3'

export function verticesToSvgPath (vs) {
  var line = d3.line()
  const r = line(vs)
  return r
}
