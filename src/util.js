
import * as d3 from 'd3'

export function computeCumMaxSellAmount (orders, amm) {
  let cumMaxSellAmount = 0
  for (let i = 0; i < orders.length; ++i) {
    cumMaxSellAmount += orders[i].ymax
  }
  const marginalXRate = amm.b2 / amm.b1
  const maxPi = orders[orders.length - 1].pi
  const dj2 = marginalXRate <= maxPi ? amm.b2 / maxPi - amm.b1 : 0
  return cumMaxSellAmount + Math.max(-dj2, 0)
}

export function computeMaxVolume (orders, amm, priceSellToken) {
  const cumMaxSellAmount = computeCumMaxSellAmount(orders, amm)
  return cumMaxSellAmount * priceSellToken
}

export function vertices2 (orders, amm, maxX, options) {
  const { ammIsMandatory } = options
  let cumMaxSellAmount = 0
  const data = []
  const marginalXRate = amm.b2 / amm.b1
  for (let i = 0; i < orders.length; ++i) {
    const dj = marginalXRate <= orders[i].pi && ammIsMandatory
      ? amm.b2 / orders[i].pi - amm.b1
      : 0
    data.push([orders[i].pi, (cumMaxSellAmount - dj) * orders[i].pi])
    cumMaxSellAmount += orders[i].ymax
    data.push([orders[i].pi, (cumMaxSellAmount - dj) * orders[i].pi])
  }
  const dj = marginalXRate <= maxX && ammIsMandatory
    ? amm.b2 / maxX - amm.b1
    : 0
  data.push([maxX, (cumMaxSellAmount - dj) * maxX])
  return data
}

export function vertices1 (orders, amm, minX, options) {
  const { ammIsMandatory } = options
  let cumMaxSellAmount = 0
  const data = []
  const marginalXRate = amm.b2 / amm.b1
  for (let i = 0; i < orders.length; ++i) {
    const dk = marginalXRate >= orders[i].pi && ammIsMandatory
      ? -amm.b2 + amm.b1 * orders[i].pi
      : 0
    data.push([orders[i].pi, cumMaxSellAmount - dk])
    cumMaxSellAmount += orders[i].ymax
    data.push([orders[i].pi, cumMaxSellAmount - dk])
  }
  const dk = marginalXRate >= minX && ammIsMandatory
    ? -amm.b2 + amm.b1 * minX
    : 0
  data.push([minX, cumMaxSellAmount - dk])
  return data
}

export function verticesToSvgPath (vs) {
  var line = d3.line()
  const r = line(vs)
  return r
}
