<template>
  <div class="container">
    <volume-x-rate-chart :bus="bus"
      v-if="loaded"/>
  </div>
</template>

<script>
import VolumeXRateChart from './components/VolumeXRateChart.vue'
import Vue from 'vue'

export default {
  name: 'App',
  components: { VolumeXRateChart },
  data: () => ({
    loaded: false,
    chartdata: null,
    bus: new Vue()
  }),
  async mounted () {
    this.loaded = false
    try {
      // const { userlist } = await fetch('/api/userlist')
      // this.chartdata = mydata
      this.loaded = true
    } catch (e) {
      console.error(e)
    }
  }
}
</script>

<style scoped>
.container {
    height: 90vh;
}
</style>
