<template>
  <g>
  <path :d="shade()" class="shade"/>
  <path :d="ammPath()" class="amm-path" vector-effect="non-scaling-stroke"/>
  <path :d="path()" class="path"/>
  <line v-for="(v, index) in orderVertices()" :key="index" ref="vertices"
    :x1="v[0]" :y1="v[1]" :x2="v[0]" :y2="v[1]"
    class="vertex" vector-effect="non-scaling-stroke"
    @mousedown="dragVertex(index, $event)"
  />
  </g>
</template>

<script>

import * as util from '../util.js'

export default {
  name: 'Orders2',
  props: {
    orders: {
      type: Array
    },
    amm: {
      type: Object
    },
    maxX: {
      type: Number
    },
    bus: {
      type: Object
    },
    ammIsMandatory: {
      type: Boolean
    }
  },
  data () {
    return {
      draggingVertex: null
    }
  },
  methods: {
    maxY () {
      return util.computeMaxVolume2(
        this.orders,
        this.amm,
        this.orders[this.orders.length - 1].pi
      )
    },
    pathVertices () {
      if (this.orders.length === 0) {
        return []
      }
      const vs = this.vertices()
      const marginalXRate = this.amm.b2 / this.amm.b1
      const idx = vs.findIndex(v => v[0] > marginalXRate)
      if (idx !== undefined && idx > 0) {
        const pt = [marginalXRate, vs[idx - 1][1] / vs[idx - 1][0] * marginalXRate]
        vs.splice(idx, 0, pt)
      }
      return vs
    },
    ammPathVertices () {
      if (this.ammIsMandatory) {
        const marginalXRate = this.amm.b2 / this.amm.b1
        const y = -this.amm.b2 + this.amm.b1 * this.maxX
        return [[marginalXRate, 0], [this.maxX, y]]
      } else {
        const vs = this.pathVertices()
        const marginalXRate = this.amm.b2 / this.amm.b1
        let idx = vs.findIndex(v => v[0] === marginalXRate)
        idx = Math.max(idx, 1)
        for (let vi = idx; vi < vs.length; ++vi) {
          vs[vi][1] += -this.amm.b2 + this.amm.b1 * vs[vi][0]
        }
        return vs
      }
    },
    path () {
      const vs = this.pathVertices()
      if (vs.length === 0) {
        return ''
      }
      return util.verticesToSvgPath(vs)
    },
    shade () {
      if (this.ammIsMandatory) {
        const vs = this.pathVertices()
        vs.push([this.maxX, 0])
        const marginalXRate = this.amm.b2 / this.amm.b1
        vs.push([marginalXRate, 0])
        return util.verticesToSvgPath(vs)
      } else {
        const vs = this.ammPathVertices()
        vs.push([this.maxX, 0])
        return util.verticesToSvgPath(vs)
      }
    },
    ammPath () {
      const vs = this.ammPathVertices()
      return util.verticesToSvgPath(vs)
    },
    vertices () {
      const data = util.vertices2(
        this.orders,
        this.amm,
        this.maxX,
        { ammIsMandatory: this.ammIsMandatory }
      )
      return data
    },
    orderVertices () {
      const data = this.vertices()
      return data.splice(0, data.length - 1)
    },
    dragVertex (index, event) {
      this.draggingVertex = index
      this.$root.$el.addEventListener('mousemove', this.moveVertex)
    },
    onMouseUp () {
      this.draggingVertex = null
      this.$root.$el.removeEventListener('mousemove', this.moveVertex)
      this.bus.$emit('max-y-changed', this.maxY())
    },
    moveVertex (event) {
      const ptSvg = this.$parent.dom2svg(
        event.clientX,
        event.clientY
      )
      if (this.draggingVertex % 2 === 0) {
        const orderIdx = this.draggingVertex / 2
        let pi = ptSvg[0]
        const minPi = orderIdx === 0 ? 0 : this.orders[orderIdx - 1].pi
        pi = Math.max(pi, minPi)
        if (orderIdx < this.orders.length - 1) {
          pi = Math.min(pi, this.orders[orderIdx + 1].pi)
        }
        this.bus.$emit('pi-changed', orderIdx, pi)
      } else {
        const orderIdx = (this.draggingVertex - 1) / 2
        const cumMaxVolume = orderIdx > 0
          ? util.computeMaxVolume2(this.orders.slice(0, orderIdx), this.amm, 1)
          : 0
        const cumY = ptSvg[1]
        const ymax = Math.max(cumY - cumMaxVolume, 0)
        this.bus.$emit('ymax-changed', orderIdx, ymax)
      }
    }
  },
  created () {
    window.addEventListener('mouseup', this.onMouseUp)
  },
  destroyed () {
    window.removeEventListener('mousemove', this.onMouseUp)
  },
  mounted () {
    this.bus.$emit('max-y-changed', this.maxY())
  },
  watch: {
    orders () {
      this.bus.$emit('max-y-changed', this.maxY())
    }
  }
}
</script>

<style scoped>
.vertex {
  stroke:rgb(255, 127, 14);
  stroke-linecap:round;
  stroke-width:10px;
  vector-effect:"non-scaling-stroke";
  cursor:grab;
}
.amm-path {
  stroke: rgb(255,127,14);
  fill: none;
  stroke-dasharray: 5;
  pointer-events: none;
}
.shade {
  stroke: none;
  fill: rgb(255,127,14);
  fill-opacity: 0.1;
  pointer-events: none;
}
.path {
  stroke: rgb(255,127,14);
  fill: none;
  vector-effect: non-scaling-stroke;
  stroke-width: 2px;
  pointer-events: none;
}
</style>
