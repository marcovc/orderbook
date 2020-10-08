<template>
  <g>
  <path :d="shade()" class="shade" :style="cssVars"/>
  <path :d="ammPath()" class="amm-path" vector-effect="non-scaling-stroke" :style="cssVars"/>
  <path :d="path()" class="path" :style="cssVars"/>
  <line v-for="(v, index) in orderVertices()" :key="index" ref="vertices"
    :x1="v[0]" :y1="v[1]" :x2="v[0]" :y2="v[1]"
    class="vertex"
    vector-effect="non-scaling-stroke"
    :style="cssVars"
    @mousedown="dragVertex(index, $event)"
  />
  </g>
</template>

<script>

import * as util from '../util.js'

// Dragging can potentially create orders with ymax = 0 which
// do not make much sense (what is the max xrate then?)
// and crashes this code.
// This is a quick workaround:
const MIN_YMAX = 1e-5

export default {
  name: 'Orders',
  props: {
    orders: {
      type: Array
    },
    amm: {
      type: Object
    },
    argMaxY: {
      type: Number
    },
    bus: {
      type: Object
    },
    ammIsMandatory: {
      type: Boolean
    },
    referential: {
      type: Object
    },
    color: {
      type: String
    }
  },
  methods: {
    mapAToY (a, x) { return this.referential.mapAToY(a, x) },
    mapYToA (y, x) { return this.referential.mapYToA(y, x) },
    mapPiToX (pi) { return this.referential.mapPiToX(pi) },
    mapXToPi (x) { return this.referential.mapXToPi(x) },
    mapAMMToX () { return this.referential.mapAMMToX(this.amm) },
    mapAMMXToY (x) { return this.referential.mapAMMXToY(this.amm, x) },
    increasing () { return this.referential.increasing },
    // Maximum amount sold for a given x coord.
    mapXToMaxA (x, orders) {
      if (!orders) orders = this.orders
      let cumMaxSellAmount = 0
      for (let i = 0; i < orders.length; ++i) {
        cumMaxSellAmount += orders[i].ymax
      }
      return cumMaxSellAmount + this.mapAMMXToY(x)
    },
    // Maximum y for a given x coord.
    mapXToMaxY (x, orders) {
      return this.mapAToY(this.mapXToMaxA(x, orders), x)
    },
    // Minimum amount sold for a given x coord (assuming du=0).
    mapXToMinA (x, orders) {
      if (!orders) orders = this.orders
      let cumMaxSellAmount = 0
      for (let i = 0; i < orders.length; ++i) {
        cumMaxSellAmount += orders[i].ymax
      }
      return cumMaxSellAmount + this.mapAMMXToMinY(x)
    },
    // Minimum y for a given x coord (assuming du=0).
    mapXToMinY (x, orders) {
      return this.mapAToY(this.mapXToMinA(x, orders), x)
    },
    // Maximum y (for any given x coord).
    maxY () {
      const x = this.mapPiToX(this.orders[this.orders.length - 1].pi)
      return this.mapXToMaxY(x)
    },
    maxX () {
      return Math.max(this.argMinY(), this.argMaxY())
    },
    // x corresponding to the minimum y.
    argMinY () {
      return this.mapPiToX(this.orders[0].pi)
    },
    // Minimum contribution of the AMM (in yy axis) for given x.
    mapAMMXToMinY (x) {
      return this.ammIsMandatory ? this.mapAMMXToY(x) : 0
    },
    curveYHelper (startX, endX, offsetFn, cumMaxSellAmount, includesEnd, f) {
      const r = []
      const test = startX <= endX ? x => x < endX : x => x > endX
      for (let x = startX; test(x); x = offsetFn(x)) {
        const ammY = f(x)
        const y = this.mapAToY(cumMaxSellAmount, x) + ammY
        r.push([x, y])
      }
      if (includesEnd) {
        const ammY = f(endX)
        const y = this.mapAToY(cumMaxSellAmount, endX) + ammY
        r.push([endX, y])
      }
      return r
    },
    // Interpolates curves differently depending if the xx scale is logarithmitic.
    curveY (startX, endX, cumMaxSellAmount, includesEnd, f) {
      const xxIsLog = false
      if (!xxIsLog) {
        const maxAbsDx = 1.05
        const dx = startX <= endX
          ? Math.min(maxAbsDx, endX / startX)
          : Math.max(1 / maxAbsDx, endX / startX)
        const offsetFn = x => x * dx
        return this.curveYHelper(startX, endX, offsetFn, cumMaxSellAmount, includesEnd, f)
      } else {
        // FIXME: should be based on screen width and not logical width
        const maxAbsDx = 0.1
        const dx = startX <= endX
          ? Math.min(maxAbsDx, endX - startX)
          : Math.max(-maxAbsDx, endX - startX)
        const offsetFn = x => x + dx
        return this.curveYHelper(startX, endX, offsetFn, cumMaxSellAmount, includesEnd, f)
      }
    },
    verticesFromOrderIntra (fromOrderIdx, cumMaxSellAmount, endX, includesEnd) {
      const startX = this.mapPiToX(this.orders[fromOrderIdx].pi)
      return this.curveY(startX, endX, cumMaxSellAmount, includesEnd, this.mapAMMXToMinY)
    },
    verticesFromOrder (fromOrderIdx, cumMaxSellAmount, endX, includesEnd) {
      const startX = this.mapPiToX(this.orders[fromOrderIdx].pi)
      const ammY = this.mapAMMXToMinY(startX)
      const y = this.mapAToY(cumMaxSellAmount, startX) + ammY
      const r = [[startX, y]]
      if (includesEnd) {
        const ammY = this.mapAMMXToMinY(endX)
        const y = this.mapAToY(cumMaxSellAmount, endX) + ammY
        r.push([endX, y])
      }
      return r
    },
    vertices (includeIntraOrder = false) {
      let cumMaxSellAmount = 0
      let data = []
      const verticesFromOrder = includeIntraOrder
        ? this.verticesFromOrderIntra
        : this.verticesFromOrder
      for (let i = 0; i < this.orders.length; ++i) {
        const x = this.mapPiToX(this.orders[i].pi)
        const ammMinY = this.mapAMMXToMinY(x)
        const y = this.mapAToY(cumMaxSellAmount, x) + ammMinY
        data.push([x, y])
        cumMaxSellAmount += this.orders[i].ymax

        const isLastOrder = i === this.orders.length - 1
        const nextX = isLastOrder ? this.argMaxY : this.mapPiToX(this.orders[i + 1].pi)
        const vs = verticesFromOrder(i, cumMaxSellAmount, nextX, isLastOrder)
        data = data.concat(vs)
      }
      return data
    },
    collectOrdersBeforeX (x, strict = true) {
      let cmp
      if (this.increasing()) {
        cmp = strict ? (x, y) => x < y : (x, y) => x <= y
      } else {
        cmp = strict ? (x, y) => x > y : (x, y) => x >= y
      }
      return this.orders.filter(o => cmp(this.mapPiToX(o.pi), x))
    },
    pathVertices () {
      if (this.orders.length === 0) {
        return []
      }
      const vs = this.vertices(true)
      const x = this.mapAMMToX()

      // Find the first vertex affected by the AMM.
      let idx
      if (this.increasing()) {
        idx = vs.findIndex(v => v[0] > x)
      } else {
        idx = vs.findIndex(v => v[0] < x)
      }

      // If not found or is the first one, then return vs.
      if (idx <= 0) return vs

      const y = this.mapXToMinY(x, this.collectOrdersBeforeX(x, false))
      const pt = [x, y]
      vs.splice(idx, 0, pt)
      return vs
    },
    ammPathVertices () {
      const x = this.mapAMMToX()
      if (this.ammIsMandatory) {
        return this.curveY(x, this.argMaxY, 0, true, this.mapAMMXToY)
      } else {
        const vs = this.pathVertices()
        let idx = vs.findIndex(v => v[0] === x)
        idx = Math.max(idx, 1)
        for (let vi = idx; vi < vs.length; ++vi) {
          vs[vi][1] += this.mapAMMXToY(vs[vi][0])
        }
        return vs
      }
    },
    shade () {
      if (this.ammIsMandatory) {
        let vs = this.pathVertices()
        vs.push([this.argMaxY, 0])
        const x = this.mapAMMToX()
        vs.push([x, 0])
        const firstOrderX = this.mapPiToX(this.orders[0].pi)
        vs = vs.concat(vs, this.curveY(x, firstOrderX, 0, false, this.mapAMMXToY))
        return util.verticesToSvgPath(vs)
      } else {
        const vs = this.ammPathVertices()
        vs.push([this.argMaxY, 0])
        return util.verticesToSvgPath(vs)
      }
    },
    path () {
      const vs = this.pathVertices()
      return util.verticesToSvgPath(vs)
    },
    ammPath () {
      const vs = this.ammPathVertices()
      return util.verticesToSvgPath(vs)
    },
    orderVertices () {
      const data = this.vertices(false)
      return data.splice(0, data.length - 1)
    },
    onMouseUp () {
      this.draggingVertex = null
      this.$root.$el.removeEventListener('mousemove', this.moveVertex)
      this.bus.$emit('arg-min-y-changed', this.argMinY())
      this.bus.$emit('max-y-changed', this.maxY())
    },
    dragVertex (index, event) {
      this.draggingVertex = index
      this.$root.$el.addEventListener('mousemove', this.moveVertex)
    },
    moveVertex (event) {
      const ptSvg = this.$parent.dom2svg(
        event.clientX,
        event.clientY
      )
      if (this.draggingVertex % 2 === 0) {
        const orderIdx = this.draggingVertex / 2
        let x = ptSvg[0]
        if (this.increasing()) {
          const minX = orderIdx === 0 ? 0 : this.mapPiToX(this.orders[orderIdx - 1].pi)
          x = Math.max(x, minX)
          if (orderIdx < this.orders.length - 1) {
            x = Math.min(x, this.mapPiToX(this.orders[orderIdx + 1].pi))
          }
        } else {
          const minX = orderIdx < this.orders.length - 1 ? this.mapPiToX(this.orders[orderIdx + 1].pi) : 0
          x = Math.max(x, minX)
          if (orderIdx > 0) {
            x = Math.min(x, this.mapPiToX(this.orders[orderIdx - 1].pi))
          }
        }
        const pi = this.mapXToPi(x)
        this.bus.$emit('pi-changed', orderIdx, pi)
      } else {
        const orderIdx = (this.draggingVertex - 1) / 2
        const x = this.mapPiToX(this.orders[orderIdx].pi)
        const minCumY = this.mapXToMinY(x, this.orders.slice(0, orderIdx))
        const maxCumY = ptSvg[1]
        const ymax = Math.max(this.mapYToA(maxCumY - minCumY, x), MIN_YMAX)
        this.bus.$emit('ymax-changed', orderIdx, ymax)
      }
    }
  },
  computed: {
    cssVars () {
      return {
        '--color': this.color
      }
    }
  },
  created () {
    window.addEventListener('mouseup', this.onMouseUp)
  },
  destroyed () {
    window.removeEventListener('mouseup', this.onMouseUp)
  },
  mounted () {
    this.bus.$emit('arg-min-y-changed', this.argMinY())
    this.bus.$emit('max-y-changed', this.maxY())
  },
  watch: {
    orders () {
      this.bus.$emit('arg-min-y-changed', this.argMinY())
      this.bus.$emit('max-y-changed', this.maxY())
    }
  }
}

</script>

<style scoped>
.vertex {
  stroke: var(--color);
  stroke-linecap:round;
  stroke-width:10px;
  vector-effect: non-scaling-stroke;
  cursor:grab;
}
.amm-path {
  stroke: var(--color);
  fill: none;
  stroke-dasharray: 5;
  pointer-events: none;
}
.shade {
  stroke: none;
  fill: var(--color);
  fill-opacity: 0.1;
  pointer-events: none;
}
.path {
  stroke: var(--color);
  fill: none;
  vector-effect: non-scaling-stroke;
  stroke-width: 2px;
  pointer-events: none;
}
</style>
