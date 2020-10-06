<template>
<svg ref="svgCanvas" width="100%" height="100%" :viewBox="`0 0 ${maxX} ${maxY}`" transform="scale(1,-1)" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="transparent" stroke="black" vector-effect="non-scaling-stroke"/>
    <orders1 ref="orders1" :orders="orders1" :amm="amm" :amm-is-mandatory="ammIsMandatory" :bus="bus1"/>
    <orders2 ref="orders2" :max-x="maxX" :orders="orders2" :amm="amm" :amm-is-mandatory="ammIsMandatory" :bus="bus2"/>
    <a-m-m ref="amm" :marginal-x-rate="marginalXRate" :bus="busAMM"/>
</svg>
</template>

<script>
import Vue from 'vue'
import Orders1 from './Orders1.vue'
import Orders2 from './Orders2.vue'
import AMM from './AMM.vue'

export default {
  name: 'VolumeXRateChart',
  components: { Orders1, Orders2, AMM },
  props: {
    bus: {
      type: Object
    },
    instance: {
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
    },
    updateData (instance) {
      const orders1 = instance.blueOrders.map(o => ({
        ymax: o.sellAmount,
        pi: o.sellAmount / o.buyAmount
      })).sort((o1, o2) => o2.pi - o1.pi)

      const orders2 = instance.orangeOrders.map(o => ({
        ymax: o.sellAmount,
        pi: o.buyAmount / o.sellAmount // for every o2, pi is actually 1/pi for convenience
      })).sort((o1, o2) => o1.pi - o2.pi)

      const amm = {
        b1: instance.amm.volume / (2 * instance.amm.marginalXRate),
        b2: instance.amm.volume / 2
      }

      amm.k = amm.b1 * amm.b2
      this.orders1 = orders1
      this.orders2 = orders2
      this.amm = amm
      this.ammIsMandatory = instance.amm.mandatory
    },
    updatedInstance () {
      const instance = {}
      instance.blueOrders = this.orders1.map(o => ({
        sellAmount: o.ymax,
        buyAmount: o.ymax / o.pi
      }))
      instance.orangeOrders = this.orders2.map(o => ({
        sellAmount: o.ymax,
        buyAmount: o.ymax * o.pi
      }))
      instance.amm = {
        volume: 2 * this.amm.b2,
        marginalXRate: this.marginalXRate
      }
      instance.amm.mandatory = this.ammIsMandatory
      return instance
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
      if (this.$refs.orders2 !== undefined) {
        maxY = Math.max(maxY, this.$refs.orders2.maxY())
      }
      this.maxY = maxY * 1.1
      this.bus.$emit('instance-changed', this.updatedInstance())
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
      this.bus.$emit('instance-changed', this.updatedInstance())
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
  },
  watch: {
    instance (newval, oldval) {
      this.updateData(newval)
    }
  },
  mounted () {
    this.updateData(this.instance)
  }
}
</script>
