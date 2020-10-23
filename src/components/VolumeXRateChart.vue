<template>
<svg ref="svgCanvas" width="100%" height="100%" :viewBox="`0 0 ${maxX} ${maxY}`" transform="scale(1,-1)" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="transparent" stroke="black" vector-effect="non-scaling-stroke"/>
    <orders
      ref="ordersSellingT2"
      :arg-max-y="ordersSellingT2ArgMaxY"
      :orders="ordersSellingT2"
      :amm="amm"
      :amm-is-mandatory="ammIsMandatory"
      :bus="bus2"
      :referential="ordersSellingT2Referential"
      color="rgb(31,119,180)"
    />
    <orders
      ref="ordersSellingT1"
      :arg-max-y="ordersSellingT1ArgMaxY"
      :orders="ordersSellingT1"
      :amm="amm"
      :amm-is-mandatory="ammIsMandatory"
      :bus="bus1"
      :referential="ordersSellingT1Referential"
      color="rgb(255, 127, 14)"
    />
    <a-m-m ref="amm" :marginal-x-rate="marginalXRate" :bus="busAMM"/>
</svg>
</template>

<script>
import Vue from 'vue'
import Orders from './Orders.vue'
import AMM from './AMM.vue'
import { REFERENTIALS } from '../referentials.js'

export default {
  name: 'VolumeXRateChart',
  components: { Orders, AMM },
  props: {
    bus: {
      type: Object
    },
    instance: {
      type: Object
    },
    referential: {
      type: String
    }
  },
  data: () => ({
    bus2: new Vue(),
    bus1: new Vue(),
    busAMM: new Vue(),
    ammIsMandatory: false,
    amm: {
      b1: 1,
      b2: 1,
      mandatory: false
    },
    ordersSellingT1: [{
      pi: 0.3,
      ymax: 0.5
    }, {
      pi: 1,
      ymax: 2
    }],
    ordersSellingT2: [{
      pi: 5,
      ymax: 1
    }, {
      pi: 2,
      ymax: 0.5
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
      const ordersSellingT2 = instance.ordersSellingT2.map(o => ({
        ymax: o.sellAmount,
        pi: o.sellAmount / o.buyAmount
      })).sort((o1, o2) => o2.pi - o1.pi)

      const ordersSellingT1 = instance.ordersSellingT1.map(o => ({
        ymax: o.sellAmount,
        pi: o.sellAmount / o.buyAmount
      })).sort((o1, o2) => o2.pi - o1.pi)

      const amm = {
        b1: instance.amm.balanceT1,
        b2: instance.amm.balanceT2
      }

      amm.k = amm.b1 * amm.b2

      this.ordersSellingT2 = ordersSellingT2
      this.ordersSellingT1 = ordersSellingT1
      this.amm = amm
      this.ammIsMandatory = instance.amm.mandatory
    },
    updatedInstance () {
      const instance = {}
      instance.ordersSellingT2 = this.ordersSellingT2.map(o => ({
        sellAmount: o.ymax,
        buyAmount: o.ymax / o.pi
      }))
      instance.ordersSellingT1 = this.ordersSellingT1.map(o => ({
        sellAmount: o.ymax,
        buyAmount: o.ymax / o.pi
      }))
      instance.amm = {
        balanceT1: this.amm.b1,
        balanceT2: this.amm.b2,
        mandatory: this.ammIsMandatory
      }
      return instance
    }
  },
  computed: {
    ordersSellingT1Referential () {
      return REFERENTIALS[this.referential].ordersSellingT1
    },
    ordersSellingT2Referential () {
      return REFERENTIALS[this.referential].ordersSellingT2
    },
    marginalXRate () {
      return (this.referential === 'X1Y1' || this.referential === 'X1Y2')
        ? this.amm.b2 / this.amm.b1
        : this.amm.b1 / this.amm.b2
    },
    ordersSellingT1ArgMaxY () {
      return this.ordersSellingT1Referential.increasing ? this.maxX : 0.001
    },
    ordersSellingT2ArgMaxY () {
      return this.ordersSellingT2Referential.increasing ? this.maxX : 0.001
    }
  },
  created () {
    // to avoid accumulating round-off errors while moving the amm
    this.amm.k = this.amm.b1 * this.amm.b2

    this.bus1.$on('max-y-changed', maxY => {
      if (this.$refs.ordersSellingT2 !== undefined) {
        maxY = Math.max(maxY, this.$refs.ordersSellingT2.maxY())
      }
      this.maxY = maxY * 1.1
      this.bus.$emit('instance-changed', this.updatedInstance())
    })
    this.bus2.$on('max-y-changed', maxY => {
      if (this.$refs.ordersSellingT1 !== undefined) {
        maxY = Math.max(maxY, this.$refs.ordersSellingT1.maxY())
      }
      this.maxY = maxY * 1.1
      this.bus.$emit('instance-changed', this.updatedInstance())
    })

    this.bus1.$on('pi-changed', (orderIdx, pi) => {
      this.ordersSellingT1[orderIdx].pi = pi
    })
    this.bus2.$on('pi-changed', (orderIdx, pi) => {
      this.ordersSellingT2[orderIdx].pi = pi
    })

    this.bus1.$on('ymax-changed', (orderIdx, ymax) => {
      this.ordersSellingT1[orderIdx].ymax = ymax
    })
    this.bus2.$on('ymax-changed', (orderIdx, ymax) => {
      this.ordersSellingT2[orderIdx].ymax = ymax
    })

    this.bus1.$on('arg-min-y-changed', maxX => {
      this.maxX = Math.max(
        maxX,
        this.$refs.ordersSellingT2.argMinY(),
        this.marginalXRate
      ) * 1.1
    })
    this.bus2.$on('arg-min-y-changed', maxX => {
      this.maxX = Math.max(
        maxX,
        this.$refs.ordersSellingT1.argMinY(),
        this.marginalXRate
      ) * 1.1
    })

    this.busAMM.$on('marginal-xrate-changed', marginalXRate => {
      let b1, b2
      if (this.referential === 'X1Y1' || this.referential === 'X1Y2') {
        b1 = Math.sqrt(this.amm.k / marginalXRate)
        b2 = this.amm.k / b1
      } else {
        b2 = Math.sqrt(this.amm.k / marginalXRate)
        b1 = this.amm.k / b2
      }
      this.amm.b1 = b1
      this.amm.b2 = b2
    })
  },
  watch: {
    instance (newval, oldval) {
      this.updateData(newval)
    },
    referential (newval, oldval) {
      this.updateData(this.instance)
    }
  },
  mounted () {
    this.updateData(this.instance)
  }
}
</script>
