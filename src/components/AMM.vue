<template>
  <g>
  <line ref="marginalXRate"
    :x1="marginalXRate" :y1="0" :x2="marginalXRate" :y2="0"
    class="vertex" vector-effect="non-scaling-stroke"
    @mousedown="dragVertex"
  />
  </g>
</template>

<script>

export default {
  name: 'AMM',
  props: {
    marginalXRate: {
      type: Number
    },
    bus: {
      type: Object
    }
  },
  data () {
    return {
      isDragging: false
    }
  },
  methods: {
    dragVertex () {
      this.isDragging = true
      this.$root.$el.addEventListener('mousemove', this.moveVertex)
    },
    onMouseUp () {
      this.isDragging = false
      this.$root.$el.removeEventListener('mousemove', this.moveVertex)
      this.bus.$emit('arg-min-y-changed', this.marginalXRate)
    },
    moveVertex (event) {
      const ptSvg = this.$parent.dom2svg(
        event.clientX,
        event.clientY
      )
      this.bus.$emit('marginal-xrate-changed', ptSvg[0])
    }
  },
  created () {
    window.addEventListener('mouseup', this.onMouseUp)
  },
  destroyed () {
    window.removeEventListener('mousemove', this.onMouseUp)
  },
  mounted () {
    this.bus.$emit('arg-min-y-changed', this.marginalXRate)
  }
}
</script>

<style scoped>
.vertex {
  stroke:rgb(44,160,44);
  stroke-linecap:round;
  stroke-width:10px;
  vector-effect:"non-scaling-stroke";
  cursor:grab;
}
</style>
