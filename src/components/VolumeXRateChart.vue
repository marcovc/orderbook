<template>
<svg ref="svgCanvas" width="100%" height="100%" :viewBox="`0 0 ${maxX} ${maxY}`" transform="scale(1,-1)" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="transparent" stroke="black" vector-effect="non-scaling-stroke"/>
    <orders1 ref="orders1" :orders="orders1" :amm="amm" :bus="bus1"/>
    <orders2 ref="orders2" :max-x="maxX" :orders="orders2" :amm="amm" :amm-is-mandatory="ammIsMandatory" :bus="bus2"/>
    <a-m-m ref="amm" :marginal-x-rate="marginalXRate" :bus="busAMM"/>
</svg>
</template>

<script>
import Vue from 'vue'
import Orders1 from './Orders1.vue'
import Orders2 from './Orders2.vue'
import AMM from './AMM.vue'
// import * as util from '../util.js'

export default {
  name: 'VolumeXRateChart',
  components: { Orders1, Orders2, AMM },
  props: {
    bus: {
      type: Object
    }
  },
  data: () => ({
    bus1: new Vue(),
    bus2: new Vue(),
    busAMM: new Vue(),
    ammIsMandatory: false,
    amm: {
      b1: 1,
      b2: 1
    },
    orders1: [{
      pi: 5,
      ymax: 1
    }, {
      pi: 2,
      ymax: 0.5
    }],
    orders2: [{
      pi: 0.3,
      ymax: 0.5
    }, {
      pi: 1,
      ymax: 2
    }],
    maxX: 100,
    maxY: 100
  }),
  methods: {
    dom2svg (x, y) {
      const svg = this.$refs.svgCanvas
      const pt = svg.createSVGPoint()

      pt.x = x
      pt.y = y
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
      return [svgP.x, svgP.y]
    },
    svg2dom (x, y) {
      const svg = this.$refs.svgCanvas
      const pt = svg.createSVGPoint()

      pt.x = x
      pt.y = y
      const domP = pt.matrixTransform(svg.getScreenCTM())
      return [domP.x, domP.y]
    }
  },
  computed: {
    marginalXRate () {
      return this.amm.b2 / this.amm.b1
    }
  },
  created () {
    // to avoid accumulating round-off errors while moving the amm
    this.amm.k = this.amm.b1 * this.amm.b2
    this.bus1.$on('max-y-changed', maxY => {
      this.maxY = Math.max(maxY, this.$refs.orders2.maxY()) * 1.1
    })
    this.bus1.$on('max-x-changed', maxX => {
      this.maxX = Math.max(maxX, this.marginalXRate) * 1.1
    })
    this.bus1.$on('pi-changed', (orderIdx, pi) => {
      this.orders1[orderIdx].pi = pi
    })
    this.bus1.$on('ymax-changed', (orderIdx, ymax) => {
      this.orders1[orderIdx].ymax = ymax
    })
    this.bus2.$on('max-y-changed', maxY => {
      if (this.$refs.orders1 !== undefined) {
        maxY = Math.max(maxY, this.$refs.orders1.maxY())
      }
      this.maxY = maxY * 1.1
    })
    this.bus2.$on('pi-changed', (orderIdx, pi) => {
      this.orders2[orderIdx].pi = pi
    })
    this.bus2.$on('ymax-changed', (orderIdx, ymax) => {
      this.orders2[orderIdx].ymax = ymax
    })
    this.busAMM.$on('marginal-xrate-changed', marginalXRate => {
      const b1 = Math.sqrt(this.amm.k / marginalXRate)
      const b2 = this.amm.k / b1
      this.amm.b1 = b1
      this.amm.b2 = b2
    })
  }
}
</script>
