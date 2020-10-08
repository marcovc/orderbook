import { Validator } from 'jsonschema'

const orderJsonSchema = {
  id: '/Order',
  type: 'object',
  properties: {
    sellAmount: { type: 'number', minimum: 0 },
    buyAmount: { type: 'number', minimum: 0, exclusiveMinimum: true }
  },
  required: ['sellAmount', 'buyAmount']
}

const instanceJsonSchema = {
  type: 'object',
  properties: {
    ordersSellingT1: {
      type: 'array',
      required: true,
      length: {
        min: 1
      },
      items: {
        $ref: '/Order'
      }
    },
    ordersSellingT2: {
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
        balanceT1: {
          type: 'number',
          required: true,
          minimum: 0,
          exclusiveMinimum: true
        },
        balanceT2: {
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
