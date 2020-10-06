import { Validator } from 'jsonschema'

const orderJsonSchema = {
  id: '/Order',
  type: 'object',
  properties: {
    sellAmount: { type: 'number', minimum: 0, exclusiveMinimum: true },
    buyAmount: { type: 'number', minimum: 0, exclusiveMinimum: true }
  },
  required: ['sellAmount', 'buyAmount']
}

const instanceJsonSchema = {
  type: 'object',
  properties: {
    blueOrders: {
      type: 'array',
      required: true,
      length: {
        min: 1
      },
      items: {
        $ref: '/Order'
      }
    },
    orangeOrders: {
      type: 'array',
      required: true,
      length: {
        min: 1
      },
      items: {
        $ref: '/Order'
      }
    },
    amm: {
      type: 'object',
      required: true,
      properties: {
        marginalXRate: {
          type: 'number',
          required: true,
          minimum: 0,
          exclusiveMinimum: true
        },
        volume: {
          type: 'number',
          required: true,
          minimum: 0,
          exclusiveMinimum: true
        },
        mandatory: {
          type: 'boolean',
          required: true
        }
      }
    }
  }
}

export function validateInstanceJson (instance) {
  var v = new Validator()
  v.addSchema(orderJsonSchema, '/Order')
  const result = v.validate(instance, instanceJsonSchema)
  return result
}
