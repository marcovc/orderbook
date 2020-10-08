
// orange sells t1
// blue sells t2

export const REFERENTIALS = {
  // yy displays amount of token 1
  // xx displays price of token 1
  // => token 2 is the reference token, i.e. p(t2) = 1
  X1Y1: {
    ordersSellingT2: {
      mapAToY: (a, x) => a / x,
      mapYToA: (y, x) => y * x,
      mapPiToX: pi => pi,
      mapXToPi: x => x,
      mapAMMToX: amm => amm.b2 / amm.b1,
      mapAMMXToY: (amm, x) => Math.max(0, amm.b2 / x - amm.b1),
      increasing: false
    },
    ordersSellingT1: {
      mapAToY: (a, x) => a,
      mapYToA: (y, x) => y,
      mapPiToX: pi => 1 / pi,
      mapXToPi: x => 1 / x,
      mapAMMToX: amm => amm.b2 / amm.b1,
      mapAMMXToY: (amm, x) => Math.max(0, -amm.b2 / x + amm.b1),
      increasing: true
    }
  },

  // yy displays amount of token 2
  // xx displays price of token 1
  // => token 2 is the reference token, i.e. p(t2) = 1
  X1Y2: {
    ordersSellingT2: {
      mapAToY: (a, x) => a,
      mapYToA: (y, x) => y,
      mapPiToX: pi => pi,
      mapXToPi: x => x,
      mapAMMToX: amm => amm.b2 / amm.b1,
      mapAMMXToY: (amm, x) => Math.max(0, amm.b2 - amm.b1 * x),
      increasing: false
    },
    ordersSellingT1: {
      mapAToY: (a, x) => a * x,
      mapYToA: (y, x) => y / x,
      mapPiToX: pi => 1 / pi,
      mapXToPi: x => 1 / x,
      mapAMMToX: amm => amm.b2 / amm.b1,
      mapAMMXToY: (amm, x) => Math.max(0, -amm.b2 + amm.b1 * x),
      increasing: true
    }
  },

  // yy displays amount of token 1
  // xx displays price of token 2
  // => token 1 is the reference token, i.e. p(t1) = 1
  X2Y1: {
    ordersSellingT2: {
      mapAToY: (a, x) => a * x,
      mapYToA: (y, x) => y / x,
      mapPiToX: pi => 1 / pi,
      mapXToPi: x => 1 / x,
      mapAMMToX: amm => amm.b1 / amm.b2,
      mapAMMXToY: (amm, x) => Math.max(0, -amm.b1 + amm.b2 * x),
      increasing: true
    },
    ordersSellingT1: {
      mapAToY: (a, x) => a,
      mapYToA: (y, x) => y,
      mapPiToX: pi => pi,
      mapXToPi: x => x,
      mapAMMToX: amm => amm.b1 / amm.b2,
      mapAMMXToY: (amm, x) => Math.max(0, amm.b1 - amm.b2 * x),
      increasing: false
    }
  },

  // yy displays amount of token 2
  // xx displays price of token 2
  // => token 1 is the reference token, i.e. p(t1) = 1
  X2Y2: {
    ordersSellingT2: {
      mapAToY: (a, x) => a,
      mapYToA: (y, x) => y,
      mapPiToX: pi => 1 / pi,
      mapXToPi: x => 1 / x,
      mapAMMToX: amm => amm.b1 / amm.b2,
      mapAMMXToY: (amm, x) => Math.max(0, -amm.b1 / x + amm.b2),
      increasing: true
    },
    ordersSellingT1: {
      mapAToY: (a, x) => a / x,
      mapYToA: (y, x) => y / x,
      mapPiToX: pi => pi,
      mapXToPi: x => x,
      mapAMMToX: amm => amm.b1 / amm.b2,
      mapAMMXToY: (amm, x) => Math.max(0, amm.b1 / x - amm.b2),
      increasing: false
    }
  }
}
