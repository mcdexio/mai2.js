import BigNumber from 'bignumber.js'
import {
  computeAccount,
  computeFunding,
  computeAMM,
  computeAMMPrice,
  computeAMMDepth,
  computeAMMInversePrice,
  computeAMMInverseDepth,
  computeDecreasePosition,
  computeIncreasePosition,
  computeFee,
  computeTradeCost,
  computAMMTradeCost,
  computeDepositByLeverage
} from '../src/computation'
import { _0, _1, SIDE, _1000, _0_1, _0_01 } from '../src/constants'
import {
  BigNumberish,
  FundingParams,
  PerpetualStorage,
  AccountStorage,
  GovParams,
  AccountComputed,
  AccountDetails
} from '../src/types'
import { normalizeBigNumberish } from '../src/utils'
import { extendExpect, getBN } from './helper'

extendExpect()

const govParams: GovParams = {
  withdrawalLockBlockCount: 2,
  brokerLockBlockCount: 2,
  intialMargin: new BigNumber(0.1),
  maintenanceMargin: new BigNumber(0.05),
  liquidationSafetyFactor: new BigNumber(0.1),
  liquidationPenaltyRate: new BigNumber(0.01),
  penaltyFundRate: new BigNumber(0.2),
  makerDevRate: new BigNumber(-0.0005),
  takerDevRate: new BigNumber(0.0015),
  oracleAddress: '0x123456',
  ammFeeRate: new BigNumber(0.001),
  markPremiumLimit: new BigNumber('0.005'), //0.5%
  fundingDampener: new BigNumber('0.0005'), // 0.05%
  emaAlpha: getBN('3327787021630616') // 2 / (600 + 1)
}
//[ '-70000000000000000000', '70000000000000000000', '86', '-35106643857103393523', '-2709000000000000000000' ],
const fundingParams: FundingParams = {
  accumulatedFundingPerContract: new BigNumber('10'),
  lastEMAPremium: getBN('-70000000000000000000'),
  lastPremium: getBN('70000000000000000000'),
  lastIndexPrice: getBN('7000000000000000000000'),
  lastFundingTimestamp: 1579601290
}

const duration = 86
const timestamp = fundingParams.lastFundingTimestamp + duration

//const expectedEMAPremium = getBN('-35106643857103393523')
//const expectedACC = getBN('-2709000000000000000000')
//const exepectedMarkPrice = fundingParams.lastIndexPrice.plus(expectedEMAPremium) // 6964.893356142896606477
//const acc = expectedACC.div(fundingParams.lastIndexPrice).div(FUNDING_TIME) // -0.0000134375
//const accumulatedFundingPerContract = fundingParams.accumulatedFundingPerContract.plus(acc) //9.9999865625
//console.log(acc.toString(), accumulatedFundingPerContract.toString())

const perpetualStorage: PerpetualStorage = {
  collateralTokenAddress: 'xxxx',
  totalSize: new BigNumber('1000'),
  longSocialLossPerContract: new BigNumber('0.1'),
  shortSocialLossPerContract: new BigNumber('0.5'),
  isEmergency: false,
  isGlobalSettled: false,
  globalSettlePrice: new BigNumber(0),
  fundingParams: fundingParams
}

const fundingResult = computeFunding(perpetualStorage.fundingParams, govParams, timestamp)

const accountStorage1: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionSide: SIDE.Buy,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const accountStorage2: AccountStorage = {
  cashBalance: new BigNumber('1000'),
  positionSide: SIDE.Buy,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const accountStorage3: AccountStorage = {
  cashBalance: new BigNumber('14000'),
  positionSide: SIDE.Sell,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const accountStorage4: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionSide: SIDE.Flat,
  positionSize: _0,
  entryValue: _0,
  entrySocialLoss: _0,
  entryFundingLoss: _0,
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const accountDetails1 = computeAccount(accountStorage1, govParams, perpetualStorage, fundingResult)
/*
const accountDetails2 = computeAccount(accountStorage2, govParams, perpetualStorage, fundingResult)
*/
const accountDetails3 = computeAccount(accountStorage3, govParams, perpetualStorage, fundingResult)
const accountDetails4 = computeAccount(accountStorage4, govParams, perpetualStorage, fundingResult)

it('Bad Funding Timestamp', function() {
  const fp: FundingParams = {
    accumulatedFundingPerContract: _0,
    lastEMAPremium: _0,
    lastPremium: _0,
    lastIndexPrice: new BigNumber(7000),
    lastFundingTimestamp: 20000
  }
  expect((): void => {
    computeFunding(fp, govParams, 10000)
  }).toThrow()
})

describe('computeAccount', function() {
  interface ComputeAccountCase {
    accountStorage: AccountStorage
    expectedOuput: AccountComputed
  }

  const expectOutput1: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.2547191286622'),
    positionMargin: new BigNumber('1601.9254719128662'),
    maintenanceMargin: new BigNumber('800.9627359564331'),
    socialLoss: new BigNumber('0.13'),
    fundingLoss: new BigNumber('23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.0247191286622'),
    pnl2: new BigNumber('13694.9847500349122'),
    roe: new BigNumber('1.36949847500349122'),
    liquidationPrice: _0,
    marginBalance: new BigNumber('23694.9847500349122'),
    maxWithdrawable: new BigNumber('22093.05927812204597'),
    availableMargin: new BigNumber('22083.05927812204597'),
    withdrawableBalance: new BigNumber('10'),
    leverage: new BigNumber('0.676060984555183532'),
    isSafe: true,
    inverseSide: SIDE.Sell,
    inverseEntryPrice: new BigNumber('0.000999900009999'),
    inverseLiquidationPrice: new BigNumber(Infinity)
  }

  const expectOutput2: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.2547191286622'),
    positionMargin: new BigNumber('1601.9254719128662'),
    maintenanceMargin: new BigNumber('800.9627359564331'),
    socialLoss: new BigNumber('0.13'),
    fundingLoss: new BigNumber('23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.0247191286622'),
    pnl2: new BigNumber('13694.9847500349122'),
    roe: new BigNumber('13.6949847500349122'),
    liquidationPrice: new BigNumber('606.07321239988558'),
    marginBalance: new BigNumber('14694.9847500349122'),
    maxWithdrawable: new BigNumber('13093.05927812204598'),
    availableMargin: new BigNumber('13083.05927812204598'),
    withdrawableBalance: new BigNumber('10'),
    leverage: new BigNumber('1.090117138031777'),
    isSafe: true,
    inverseSide: SIDE.Sell,
    inverseEntryPrice: new BigNumber('0.000999900009999'),
    inverseLiquidationPrice: new BigNumber('0.001649965679955')
  }

  const expectOutput3: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.2547191286622'),
    positionMargin: new BigNumber('1601.9254719128662'),
    maintenanceMargin: new BigNumber('800.9627359564331'),
    socialLoss: new BigNumber('1.05'),
    fundingLoss: new BigNumber('-23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    pnl1: new BigNumber('-13719.0247191286622'),
    pnl2: new BigNumber('-13696.164750034912'),
    roe: new BigNumber('-0.97829748214535087'),
    liquidationPrice: new BigNumber('6759.0434654632505176'),
    marginBalance: new BigNumber('303.8352499650878'),
    maxWithdrawable: _0,
    availableMargin: _0,
    withdrawableBalance: _0,
    leverage: new BigNumber('52.72348985500976'),
    isSafe: false,
    inverseSide: SIDE.Buy,
    inverseEntryPrice: new BigNumber('0.0009999000099990001'),
    inverseLiquidationPrice: new BigNumber('0.00014794992887820734')
  }

  const expectOutput4: AccountComputed = {
    entryPrice: _0,
    positionValue: _0,
    positionMargin: _0,
    maintenanceMargin: _0,
    socialLoss: _0,
    fundingLoss: _0, // 9.9999865625 * 2.3 -(-0.91)
    pnl1: _0,
    pnl2: _0,
    roe: _0,
    liquidationPrice: _0,
    marginBalance: new BigNumber('10000'),
    availableMargin: new BigNumber('9990'),
    maxWithdrawable: new BigNumber('10000'),
    withdrawableBalance: new BigNumber('10'),
    leverage: _0,
    isSafe: true,
    inverseSide: SIDE.Flat,
    inverseEntryPrice: _0,
    inverseLiquidationPrice: _0
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      accountStorage: accountStorage1,
      expectedOuput: expectOutput1
    },
    {
      accountStorage: accountStorage2,
      expectedOuput: expectOutput2
    },
    {
      accountStorage: accountStorage3,
      expectedOuput: expectOutput3
    },
    {
      accountStorage: accountStorage4,
      expectedOuput: expectOutput4
    }
  ]

  successCases.forEach((element, index) => {
    it(`computeAccount.${index}`, function() {
      const accountStorage = element.accountStorage
      const expectedOutput = element.expectedOuput
      const accountDetails = computeAccount(accountStorage, govParams, perpetualStorage, fundingResult)
      const computed = accountDetails.accountComputed
      expect(computed.entryPrice).toBeBigNumber(expectedOutput.entryPrice)
      expect(computed.positionValue).toApproximate(expectedOutput.positionValue)
      expect(computed.positionMargin).toApproximate(expectedOutput.positionMargin)
      expect(computed.maintenanceMargin).toApproximate(expectedOutput.maintenanceMargin)
      expect(computed.socialLoss).toBeBigNumber(expectedOutput.socialLoss)
      expect(computed.fundingLoss).toApproximate(expectedOutput.fundingLoss)
      expect(computed.pnl1).toApproximate(expectedOutput.pnl1)
      expect(computed.pnl2).toApproximate(expectedOutput.pnl2)
      expect(computed.roe).toApproximate(expectedOutput.roe)
      expect(computed.liquidationPrice).toApproximate(expectedOutput.liquidationPrice)
      expect(computed.marginBalance).toApproximate(expectedOutput.marginBalance)
      expect(computed.availableMargin).toApproximate(expectedOutput.availableMargin)
      expect(computed.maxWithdrawable).toApproximate(expectedOutput.maxWithdrawable)
      expect(computed.withdrawableBalance).toApproximate(expectedOutput.withdrawableBalance)
      expect(computed.leverage).toApproximate(expectedOutput.leverage)
      expect(computed.isSafe).toEqual(expectedOutput.isSafe)
      expect(computed.inverseSide).toEqual(expectedOutput.inverseSide)
      expect(computed.inverseEntryPrice).toApproximate(expectedOutput.inverseEntryPrice)
      expect(computed.inverseLiquidationPrice).toApproximate(expectedOutput.inverseLiquidationPrice)
    })
  })
})

const ammStorage: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionSide: SIDE.Buy,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
  withdrawalApplication: {
    amount: new BigNumber('10'),
    height: 123
  }
}

const ammDetails = computeAMM(ammStorage, govParams, perpetualStorage, fundingResult)

describe('amm', function() {
  it('computeAMM', function() {
    //socialLoss: new BigNumber('0.13'),
    //fundingLoss: new BigNumber('23.90996909375'), // 9.9999865625 * 2.3 -(-0.91)
    // 10000 - 2300.23 - 0.13 - 23.90996909375
    expect(ammDetails.ammComputed.availableMargin).toApproximate(new BigNumber(7675.73003090625))
    expect(ammDetails.ammComputed.fairPrice).toApproximate(new BigNumber(3337.273926480978))
    expect(ammDetails.ammComputed.inverseFairPrice).toApproximate(new BigNumber(1 / 3337.273926480978))
  })

  it(`computeAMMPrice.buyTooLarge`, function() {
    expect((): void => {
      computeAMMPrice(ammDetails, SIDE.Buy, 4)
    }).toThrow()
  })

  it(`computeAMMPrice.buy`, function() {
    const price = computeAMMPrice(ammDetails, SIDE.Buy, 0.5)
    expect(price).toApproximate(new BigNumber(4264.294461614583333))
  })

  it(`computeAMMPrice.sell`, function() {
    const price = computeAMMPrice(ammDetails, SIDE.Sell, 0.5)
    expect(price).toApproximate(new BigNumber(2741.332153895089))
  })

  it('computeAMMDepth', function() {
    const depth = computeAMMDepth(ammDetails, 0.1, 3)

    expect(depth.bids.length).toEqual(4)
    expect(depth.asks.length).toEqual(4)

    expect(depth.bids[0].price).toApproximate(new BigNumber(2952.20385804086538))
    expect(depth.bids[0].amount).toApproximate(new BigNumber(0.3))
    expect(depth.bids[1].price).toApproximate(new BigNumber(3070.2920123625))
    expect(depth.bids[1].amount).toApproximate(new BigNumber(0.2))
    expect(depth.bids[2].price).toApproximate(new BigNumber(3198.2208462109375))
    expect(depth.bids[2].amount).toApproximate(new BigNumber(0.1))
    expect(depth.bids[3].price).toApproximate(new BigNumber(3337.273926480978))
    expect(depth.bids[3].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[0].price).toApproximate(new BigNumber(3337.273926480978))
    expect(depth.asks[0].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[1].price).toApproximate(new BigNumber(3488.968195866477))
    expect(depth.asks[1].amount).toApproximate(new BigNumber(0.1))
    expect(depth.asks[2].price).toApproximate(new BigNumber(3655.109538526786))
    expect(depth.asks[2].amount).toApproximate(new BigNumber(0.2))
    expect(depth.asks[3].price).toApproximate(new BigNumber(3837.865015453125))
    expect(depth.asks[3].amount).toApproximate(new BigNumber(0.3))
  })

  it('computeAMMDepthDefault', function() {
    const depth = computeAMMDepth(ammDetails)

    expect(depth.bids.length).toEqual(21)
    expect(depth.asks.length).toEqual(21)
  })

  it('computeAMMDepthTooLarge', function() {
    const depth = computeAMMDepth(ammDetails, 1)

    expect(depth.bids.length).toEqual(21)
    expect(depth.asks.length).toEqual(3)
  })

  it(`computeAMMInversePrice.sellTooLarge`, function() {
    expect((): void => {
      computeAMMInversePrice(ammDetails, SIDE.Sell, 4)
    }).toThrow()
  })

  it('computeAMMInverseDepth', function() {
    const depth = computeAMMInverseDepth(ammDetails, 0.1, 3)

    expect(depth.bids.length).toEqual(4)
    expect(depth.asks.length).toEqual(4)

    expect(depth.bids[0].price).toApproximate(new BigNumber(1 / 3837.865015453125))
    expect(depth.bids[0].amount).toApproximate(new BigNumber(0.3))
    expect(depth.bids[1].price).toApproximate(new BigNumber(1 / 3655.109538526786))
    expect(depth.bids[1].amount).toApproximate(new BigNumber(0.2))
    expect(depth.bids[2].price).toApproximate(new BigNumber(1 / 3488.968195866477))
    expect(depth.bids[2].amount).toApproximate(new BigNumber(0.1))
    expect(depth.bids[3].price).toApproximate(new BigNumber(1 / 3337.273926480978))
    expect(depth.bids[3].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[0].price).toApproximate(new BigNumber(1 / 3337.273926480978))
    expect(depth.asks[0].amount).toApproximate(new BigNumber(0))
    expect(depth.asks[1].price).toApproximate(new BigNumber(1 / 3198.2208462109375))
    expect(depth.asks[1].amount).toApproximate(new BigNumber(0.1))
    expect(depth.asks[2].price).toApproximate(new BigNumber(1 / 3070.2920123625))
    expect(depth.asks[2].amount).toApproximate(new BigNumber(0.2))
    expect(depth.asks[3].price).toApproximate(new BigNumber(1 / 2952.20385804086538))
    expect(depth.asks[3].amount).toApproximate(new BigNumber(0.3))
  })

  it('computeAMMInverseDepthDefault', function() {
    const depth = computeAMMInverseDepth(ammDetails)

    expect(depth.bids.length).toEqual(21)
    expect(depth.asks.length).toEqual(21)
  })

  it('computeAMMInverseDepthTooLarge', function() {
    const depth = computeAMMInverseDepth(ammDetails, 1)

    expect(depth.bids.length).toEqual(3)
    expect(depth.asks.length).toEqual(21)
  })
})

describe('computeTrade.Fail', function() {
  it('decrease.FlatSide', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage4, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('decrease.ZeroPrice', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _0, _1)
    }).toThrow()
  })

  it('decrease.ZeroAmount', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('decrease.LargeAmount', function() {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _1, _1000)
    }).toThrow()
  })

  it('increase.FlatSide', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Flat, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('increase.BadSide', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Sell, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('increase.ZeroPrice', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Buy, _0, _1)
    }).toThrow()
  })

  it('increase.ZeroAmount', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Buy, _1, _0)
    }).toThrow()
  })

  it('increase.BadSide', function() {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, SIDE.Sell, _1, _0)
    }).toThrow()
  })

  it('fee.ZeroPrice', function() {
    expect((): void => {
      computeFee(0, 1, 0.1)
    }).toThrow()
  })

  it('fee.ZeroAmount', function() {
    expect((): void => {
      computeFee(1, 0, 0.1)
    }).toThrow()
  })

  it('tradeCost.ZeroAmount', function() {
    expect((): void => {
      computeTradeCost(govParams, perpetualStorage, fundingResult, accountDetails1, SIDE.Buy, _1, _0, _1, _0_01)
    }).toThrow()
  })

  it('tradeCost.ZeroPrice', function() {
    expect((): void => {
      computeTradeCost(govParams, perpetualStorage, fundingResult, accountDetails1, SIDE.Buy, _0, _1, _1, _0_01)
    }).toThrow()
  })

  it('tradeCost.BadLev', function() {
    const negatedOne = _1.negated()
    expect((): void => {
      computeTradeCost(govParams, perpetualStorage, fundingResult, accountDetails1, SIDE.Buy, _1, _1, negatedOne, _0_01)
    }).toThrow()
  })
})

describe('computeTradeCost', function() {
  interface TradeCostCase {
    name: string
    input: {
      accountDetails: AccountDetails
      side: SIDE
      price: BigNumberish
      amount: BigNumberish
      leverage: BigNumberish
      feeRate: BigNumberish
    }
    expectedOutput: {
      account: {
        cashBalance: BigNumberish
        marginBalance: BigNumberish
        positionSide: SIDE
        positionSize: BigNumberish
        entryValue: BigNumberish
        entrySocialLoss: BigNumberish
        entryFundingLoss: BigNumberish
      }
      marginCost: BigNumberish
      fee: BigNumberish
    }
  }

  //console.log(fundingResult.markPrice.toString())
  //fundingResult.accumulatedFundingPerContract = 9.9999865625
  //fundingResult.markPrice = 6964.893356142896606476516234
  //new BigNumber('23694.9847500349122')
  const tradeCostCases: Array<TradeCostCase> = [
    {
      name: 'increase long',
      input: {
        accountDetails: accountDetails1,
        side: SIDE.Buy,
        price: 2000,
        amount: 1,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          cashBalance: 9980,
          /*
            9980 +
            (6964.893356142896606476516234 * 3.3 - 4300.23) -
            (0.1 * 3.3 - 0.2) -
            (9.9999865625 * 3.3 - 9.0899865625),
          */
          marginBalance: '28639.87810617780800190864675',
          positionSide: SIDE.Buy,
          positionSize: '3.3',
          entryValue: '4300.23',
          entrySocialLoss: '0.2',
          entryFundingLoss: '9.0899865625'
        },
        marginCost: 0,
        fee: 20
      }
    },
    {
      name: 'increase long with leverage cost',
      input: {
        accountDetails: accountDetails1,
        side: SIDE.Buy,
        price: 7000,
        amount: 5,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          cashBalance: 9650,
          /*
            9650 +
            (6964.893356142896606476516234 * 7.3 - 37300.23) -
            (0.1 * 7.3 - 0.6) -
            (9.9999865625 * 7.3 - 49.0899328125),
          */
          marginBalance: '23169.4515307493952',
          positionSide: SIDE.Buy,
          positionSize: '7.3',
          entryValue: '37300.23',
          entrySocialLoss: '0.6',
          entryFundingLoss: '49.0899328125'
        },
        /*  6964.893356142896606476516234 * 7.3 / 2 - 23169.4515307493952 */
        marginCost: '2252.40921917217739',
        fee: 350
      }
    },
    {
      name: 'increase long with loss',
      input: {
        accountDetails: accountDetails1,
        side: SIDE.Buy,
        price: 10000,
        amount: 10,
        leverage: 10,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          cashBalance: 9000,
          /*
            9000 +
            (6964.893356142896606476516234 * 12.3 - 102300.23) -
            (0.1 * 12.3 - 1.1) -
            (9.9999865625 * 12.3 - 99.089865625),
          */
          marginBalance: '-7656.08168853612174034',
          positionSide: SIDE.Buy,
          positionSize: '12.3',
          entryValue: '102300.23',
          entrySocialLoss: '1.1',
          entryFundingLoss: '99.089865625'
        },
        /*  6964.893356142896606476516234 * 7.3 / 2 - 23169.4515307493952 */
        marginCost: '16222.9005165918845663',
        fee: 1000
      }
    },
    {
      name: 'decrease long',
      input: {
        accountDetails: accountDetails1,
        side: SIDE.Sell,
        price: 2000,
        amount: 1,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 999.9 - 20 - (0.1 - 0.1/2.3) * 1 - (9.9999865625 - (-0.91)/2.3 ) * 1
          cashBalance: '10969.44783952445652173913',
          positionSide: SIDE.Buy,
          positionSize: '1.3',
          entryValue: '1300.13',
          entrySocialLoss: '0.0565217391304',
          entryFundingLoss: '-0.514347826087',
          /*
            10969.44783952445652173913 +
            (6964.893356142896606476516234 * 1.3 - 1300.13) -
            (0.1 * 1.3 - 0.0565217391304) -
            (9.9999865625 * 1.3 - (-0.514347826087)),
          */
          marginBalance: '18710.0913938920155884194711'
        },
        marginCost: 0,
        fee: 20
      }
    },
    {
      name: 'decrease long to zero',
      input: {
        accountDetails: accountDetails1,
        side: SIDE.Sell,
        price: 2000,
        amount: 2.3,
        leverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 2299.77‬ - 46 - (0.1 * 2.3 - 0.1) - (9.9999865625 * 2.3 - (-0.91))
          cashBalance: '12229.73003090625',
          positionSide: SIDE.Flat,
          positionSize: 0,
          entryValue: 0,
          entrySocialLoss: 0,
          entryFundingLoss: 0,
          marginBalance: '12229.73003090625'
        },
        marginCost: 0,
        fee: 46
      }
    },
    {
      name: 'decrease long to short',
      input: {
        accountDetails: accountDetails1,
        side: SIDE.Sell,
        price: 2000,
        amount: 3.3,
        leverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 2299.77‬ - 66 - (0.1 * 2.3 - 0.1) - (9.9999865625 * 2.3 - (-0.91))
          cashBalance: '12209.73003090625',
          positionSide: SIDE.Sell,
          positionSize: 1,
          entryValue: 2000,
          entrySocialLoss: '0.5',
          entryFundingLoss: '9.9999865625',
          /*
            12209.73003090625 + (2000 - 6964.893356142896606476516234 * 1)
          */
          marginBalance: '7244.83667476335339'
        },
        marginCost: 0,
        fee: 66
      }
    },
    {
      name: 'increase zero to long with cost',
      input: {
        accountDetails: accountDetails4,
        side: SIDE.Buy,
        price: 7000,
        amount: 2,
        leverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          cashBalance: '9860',
          positionSide: SIDE.Buy,
          positionSize: 2,
          entryValue: '14000',
          entrySocialLoss: '0.2',
          entryFundingLoss: '19.999973125',
          /*
            9860 + (6964.893356142896606476516234 * 2 - 14000)
          */
          marginBalance: '9789.7867122857932129'
        },
        marginCost: 4140,
        fee: 140
      }
    },
    {
      name: 'decrease zero to short with cost',
      input: {
        accountDetails: accountDetails4,
        side: SIDE.Sell,
        price: 7000,
        amount: 2,
        leverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          cashBalance: '9860',
          positionSide: SIDE.Sell,
          positionSize: 2,
          entryValue: '14000',
          entrySocialLoss: '1',
          entryFundingLoss: '19.999973125',
          /*
            9860 + (14000-6964.893356142896606476516234 * 2)
          */
          marginBalance: '9930.2132877142067870'
        },
        marginCost: '3999.5734245715864259',
        fee: 140
      }
    },
    {
      name: 'decrease short',
      input: {
        accountDetails: accountDetails3,
        side: SIDE.Buy,
        price: 2000,
        amount: 1,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 999.9 - 20 - (0.5 - 0.1/2.3) * 1 + (9.9999865625 - (-0.91)/2.3 ) * 1
          cashBalance: '12990.039116997282608',
          positionSide: SIDE.Sell,
          positionSize: '1.3',
          entryValue: '1300.13',
          entrySocialLoss: '0.0565217391304',
          entryFundingLoss: '-0.514347826087',
          /*
            12990.039116997282608 +
            (1300.13 - 6964.893356142896606476516234 * 1.3) -
            (0.5 * 1.3 - 0.0565217391304)
            + (9.9999865625 * 1.3 - (-0.514347826087)),
          */
          marginBalance: '5248.7286061079844115805'
        },
        marginCost: 0,
        fee: 20
      }
    },
    {
      name: 'decrease short to zero',
      input: {
        accountDetails: accountDetails3,
        side: SIDE.Buy,
        price: 2000,
        amount: 2.3,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 2299.77 - 46 - (0.5 * 2.3 - 0.1) + (9.9999865625 * 2.3 - (-0.91))
          cashBalance: '11677.08996909375',
          positionSide: SIDE.Flat,
          positionSize: 0,
          entryValue: 0,
          entrySocialLoss: 0,
          entryFundingLoss: 0,
          marginBalance: '11677.08996909375'
        },
        marginCost: 0,
        fee: 46
      }
    },
    {
      name: 'decrease short to long with leverage',
      input: {
        accountDetails: accountDetails3,
        side: SIDE.Buy,
        price: 2000,
        amount: 3.3,
        leverage: 0.1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 2299.77 - 66 - (0.5 * 2.3 - 0.1) + (9.9999865625 * 2.3 - (-0.91))
          cashBalance: '11657.08996909375',
          positionSide: SIDE.Buy,
          positionSize: 1,
          entryValue: 2000,
          entrySocialLoss: '0.1',
          entryFundingLoss: '9.9999865625',
          // 11657.08996909375 + (6964.893356142896606476516234-2000) * 1
          marginBalance: '16621.983325236646'
        },
        marginCost: '53026.9502361923200',
        fee: 66
      }
    }
  ]

  tradeCostCases.forEach((element) => {
    const input = element.input
    const name = element.name
    const expectedOutput = element.expectedOutput

    it(`tradeCost[${name}]`, function() {
      const tradeCost = computeTradeCost(
        govParams,
        perpetualStorage,
        fundingResult,
        input.accountDetails,
        input.side,
        input.price,
        input.amount,
        input.leverage,
        input.feeRate
      )
      expect(tradeCost.account.accountStorage.cashBalance).toApproximate(
        normalizeBigNumberish(expectedOutput.account.cashBalance)
      )

      expect(expectedOutput.account.positionSide).toEqual(tradeCost.account.accountStorage.positionSide)
      expect(tradeCost.account.accountStorage.positionSize).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.positionSize)
      )
      expect(tradeCost.account.accountStorage.entryValue).toBeBigNumber(
        normalizeBigNumberish(expectedOutput.account.entryValue)
      )
      expect(tradeCost.account.accountStorage.entrySocialLoss).toApproximate(
        normalizeBigNumberish(expectedOutput.account.entrySocialLoss)
      )
      expect(tradeCost.account.accountStorage.entryFundingLoss).toApproximate(
        normalizeBigNumberish(expectedOutput.account.entryFundingLoss)
      )

      expect(tradeCost.account.accountComputed.marginBalance).toApproximate(
        normalizeBigNumberish(expectedOutput.account.marginBalance)
      )

      expect(tradeCost.marginCost).toApproximate(normalizeBigNumberish(expectedOutput.marginCost))
      expect(tradeCost.fee).toBeBigNumber(normalizeBigNumberish(expectedOutput.fee))
    })
  })

  it(`computeAMMTradeCost`, function() {
    const ammCost = computAMMTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      SIDE.Buy,
      0.5,
      0.5
    )
    expect(ammCost.price).toApproximate(new BigNumber('4264.294461614583333'))
    expect(ammCost.marginCost).toApproximate(new BigNumber('13963.448965178170393967576'))
  })
})

describe('computeDepositByLeverage', function() {
  it('bad leverage', function() {
    expect((): void => {
      computeDepositByLeverage(accountDetails1, fundingResult, -1)
    }).toThrow()
  })

  it('positive', function() {
    const deposit = computeDepositByLeverage(accountDetails1, fundingResult, 0.5)
    expect(deposit).toApproximate(new BigNumber('8343.5246882224122'))
  })

  it('nagetive', function() {
    const deposit = computeDepositByLeverage(accountDetails1, fundingResult, 10)
    expect(deposit).toApproximate(new BigNumber('-22093.05927812204598'))
  })
})
