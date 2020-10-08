<template>
  <v-app>
    <v-main>
      <v-container fill-height class='ma-0' fluid>
        <v-row>
          <v-col cols='8'>
            <v-row>
              <v-col class='pt-0 pb-0 pr-0' style='height:50vh;'>
                <volume-x-rate-chart v-if='validationErrors.length === 0' :instance='instance' :bus='bus' :referential='referential'/>
                <p v-for='(e, idx) in validationErrors' :key='idx'>
                  {{ e.stack }}
                </p>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-radio-group v-model="referential">
                  <v-radio label="xx=price(T1), yy=amount(T1)" value="X1Y1"></v-radio>
                  <v-radio label="xx=price(T1), yy=amount(T2)" value="X1Y2"></v-radio>
                  <v-radio label="xx=price(T2), yy=amount(T1)" value="X2Y1"></v-radio>
                  <v-radio label="xx=price(T2), yy=amount(T2)" value="X2Y2"></v-radio>
                </v-radio-group>
                <p>Orange orders sell T1, blue orders sell T2.</p>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols='4'>
            <vue-json-editor
              v-model='instance'
              :show-btns='false'
              :expandedOnStart='true'
              mode='form'
              @json-change='onInstanceChange'
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Vue from 'vue'

import VolumeXRateChart from './components/VolumeXRateChart'
import vueJsonEditor from 'vue-json-editor'
import { validateInstanceJson } from './instance.js'

export default {
  name: 'App',

  components: {
    VolumeXRateChart, vueJsonEditor
  },

  data: () => ({
    validationErrors: [],
    bus: new Vue(),
    referential: 'X1Y1',
    instance: {
      ordersSellingT1: [
        {
          sellAmount: 0.5,
          buyAmount: 0.15
        },
        {
          sellAmount: 2,
          buyAmount: 2
        }
      ],
      ordersSellingT2: [
        {
          sellAmount: 1,
          buyAmount: 0.2
        },
        {
          sellAmount: 0.5,
          buyAmount: 0.25
        }
      ],
      amm: {
        balanceT1: 1,
        balanceT2: 1,
        mandatory: true
      }
    }
  }),
  methods: {
    onInstanceChange (json) {
      const result = validateInstanceJson(json)
      this.validationErrors = result.errors
    }
  },
  mounted () {
    this.bus.$on('instance-changed', newInstance => {
      if (JSON.stringify(newInstance) === JSON.stringify(this.instance)) {
        return
      }
      this.instance = newInstance
    })
  }
}
</script>

<style>
.jsoneditor-vue {
  height: 95vh;
}
</style>
