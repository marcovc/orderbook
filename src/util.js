
import * as d3 from 'd3'

export function computeCumMaxSellAmount2 (orders, amm, xrate) {
  let cumMaxSellAmount = 0
  for (let i = 0; i < orders.length; ++i) {
    cumMaxSellAmount += orders[i].ymax
  }
  const marginalXRate = amm.b2 / amm.b1
  const dj = marginalXRate <= xrate ? amm.b2 / xrate - amm.b1 : 0
  return cumMaxSellAmount + Math.max(-dj, 0)
}

export function computeMaxVolume2 (orders, amm, xrate) {
  const cumMaxSellAmount = computeCumMaxSellAmount2(orders, amm)
  return cumMaxSellAmount * xrate
}

export function computeCumMaxSellAmount1 (orders, amm) {
  let cumMaxSellAmount = 0
  for (let i = 0; i < orders.length; ++i) {
    cumMaxSellAmount += orders[i].ymax
  }
  const marginalXRate = amm.b2 / amm.b1
  const maxPi = orders[orders.length - 1].pi
  const dk = marginalXRate >= maxPi ? -amm.b2 + amm.b1 * maxPi : 0
  return cumMaxSellAmount + Math.max(-dk, 0)
}

export function computeMaxVolume1 (orders, amm, priceSellToken) {
  const cumMaxSellAmount = computeCumMaxSellAmount1(orders, amm)
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
