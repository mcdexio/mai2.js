import BigNumber from 'bignumber.js'
import {
  computeAccount,
  computeFunding,
  computeAMM,
  computeAMMPrice,
  computeAMMInversePrice,
  computeDecreasePosition,
  computeIncreasePosition,
  computeFee,
  computeTradeCost,
  computeAMMTradeCost,
  computeAMMInverseTradeCost,
  computeDepositByLeverage,
  computeAMMAmount,
  computeAMMInverseAmount,
  calculateLiquidateAmount,
  computeLiquidate
} from '../src/computation'
import { _0, _1, SIDE, _1000, _0_1, _0_01, TRADE_SIDE } from '../src/constants'
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
  initialMargin: new BigNumber(0.1),
  maintenanceMargin: new BigNumber(0.05),
  liquidationPenaltyRate: new BigNumber(0.005),
  penaltyFundRate: new BigNumber(0.005),
  makerDevRate: new BigNumber(-0.0005),
  takerDevRate: new BigNumber(0.0015),
  lotSize: new BigNumber(1),
  tradingLotSize: new BigNumber(1),
  poolFeeRate: new BigNumber(0.001),
  poolDevFeeRate: new BigNumber(0.0015),
  markPremiumLimit: new BigNumber('0.005'), //0.5%
  fundingDampener: new BigNumber('0.0005'), // 0.05%
  emaAlpha: getBN('3327787021630616'), // 2 / (600 + 1)
  updatePremiumPrize: _0,
  amm: '0x0000000000000000000000000000000000000000',
  poolAccount: '0x0000000000000000000000000000000000000000'
}
//[ '-70000000000000000000', '70000000000000000000', '86', '-35106643857103393523', '-2709000000000000000000' ],
const fundingParams: FundingParams = {
  accumulatedFundingPerContract: new BigNumber('10'),
  lastEMAPremium: getBN('-70000000000000000000'),
  lastPremium: getBN('70000000000000000000'),
  lastIndexPrice: getBN('7000000000000000000000'),
  lastFundingTimestamp: 1579601290
}

const timestamp = fundingParams.lastFundingTimestamp + 86
const timestamp2 = fundingParams.lastFundingTimestamp + 500

//const expectedEMAPremium = getBN('-35106643857103393523')
//const expectedACC = getBN('-2709000000000000000000')
//const exepectedMarkPrice = cap[fundingParams.lastIndexPrice.plus(expectedEMAPremium)] // 6964.8933 => 6965
//const acc = expectedACC.div(fundingParams.lastIndexPrice).div(FUNDING_TIME) // -0.0940625‬
//const accumulatedFundingPerContract = fundingParams.accumulatedFundingPerContract.plus(acc) // 9.9059375
//console.log(acc.toString(), accumulatedFundingPerContract.toString())

const perpetualStorage: PerpetualStorage = {
  collateralTokenAddress: 'xxxx',
  totalSize: new BigNumber('1000'),
  longSocialLossPerContract: new BigNumber('0.1'),
  shortSocialLossPerContract: new BigNumber('0.5'),
  insuranceFundBalance: new BigNumber('0.0'),
  isEmergency: false,
  isGlobalSettled: false,
  globalSettlePrice: new BigNumber(0),
  isPaused: false,
  isWithdrawDisabled: false,
  oraclePrice: getBN('7000000000000000000000'),
  oracleTimestamp: 1579601290,
  shareTokenAddress: '',
  ...fundingParams
}

const fundingResult = computeFunding(perpetualStorage, govParams, timestamp)
const fundingResult2 = computeFunding(perpetualStorage, govParams, timestamp2)

const accountStorage1: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionSide: SIDE.Buy,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
}

const accountStorage2: AccountStorage = {
  cashBalance: new BigNumber('1000'),
  positionSide: SIDE.Buy,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
}

const accountStorage3: AccountStorage = {
  cashBalance: new BigNumber('14000'),
  positionSide: SIDE.Sell,
  positionSize: new BigNumber('2.3'),
  entryValue: new BigNumber('2300.23'),
  entrySocialLoss: new BigNumber('0.1'),
  entryFundingLoss: new BigNumber('-0.91'),
}

const accountStorage4: AccountStorage = {
  cashBalance: new BigNumber('10000'),
  positionSide: SIDE.Flat,
  positionSize: _0,
  entryValue: _0,
  entrySocialLoss: _0,
  entryFundingLoss: _0,
}

const accountDetails1 = computeAccount(accountStorage1, govParams, perpetualStorage, fundingResult)
/*
const accountDetails2 = computeAccount(accountStorage2, govParams, perpetualStorage, fundingResult)
*/
const accountDetails3 = computeAccount(accountStorage3, govParams, perpetualStorage, fundingResult)
const accountDetails4 = computeAccount(accountStorage4, govParams, perpetualStorage, fundingResult)

it('computeFunding', function () {
  expect(fundingResult.accumulatedFundingPerContract).toApproximate(new BigNumber('9.9059375'))
  expect(fundingResult.emaPremium).toApproximate(new BigNumber('-35.106643857103393523'))
  expect(fundingResult.fundingRate).toApproximate(new BigNumber('-0.0045'))
  expect(fundingResult.markPrice).toApproximate(new BigNumber('6965'))
  expect(fundingResult.premiumRate).toApproximate(new BigNumber('-0.005'))
  expect(fundingResult.timestamp).toEqual(timestamp)

  expect(fundingResult2.accumulatedFundingPerContract).toApproximate(new BigNumber('10.057955400119555507'))
  expect(fundingResult2.emaPremium).toApproximate(new BigNumber('43.557456409235274904'))
  expect(fundingResult2.fundingRate).toApproximate(new BigNumber('0.0045'))
  expect(fundingResult2.markPrice).toApproximate(new BigNumber('7035'))
  expect(fundingResult2.premiumRate).toApproximate(new BigNumber('0.005'))
  expect(fundingResult2.timestamp).toEqual(timestamp2)
})

describe('computeAccount', function () {
  interface ComputeAccountCase {
    accountStorage: AccountStorage
    expectedOutput: AccountComputed
  }

  const expectOutput1: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    socialLoss: new BigNumber('0.13'),
    fundingLoss: new BigNumber('23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.27'),
    pnl2: new BigNumber('13695.44634375'),
    roe: new BigNumber('1.369544634375'),
    liquidationPrice: _0,
    marginBalance: new BigNumber('23695.44634375'),
    maxWithdrawable: new BigNumber('22093.49634375'),
    availableMargin: new BigNumber('22093.49634375'),
    withdrawableBalance: new BigNumber('22093.49634375'),
    leverage: new BigNumber('0.67605816609676835812'),
    isSafe: true,
    inverseSide: SIDE.Sell,
    inverseEntryPrice: new BigNumber('0.000999900009999'),
    inverseLiquidationPrice: new BigNumber(Infinity)
  }

  const expectOutput2: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    socialLoss: new BigNumber('0.13'),
    fundingLoss: new BigNumber('23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    pnl1: new BigNumber('13719.27'),
    pnl2: new BigNumber('13695.44634375'),
    roe: new BigNumber('13.69544634375'),
    liquidationPrice: new BigNumber('605.97421338672768878719'),
    marginBalance: new BigNumber('14695.44634375'),
    maxWithdrawable: new BigNumber('13093.49634375'),
    availableMargin: new BigNumber('13093.49634375'),
    withdrawableBalance: new BigNumber('13093.49634375'),
    leverage: new BigNumber('1.09009958767350557018'),
    isSafe: true,
    inverseSide: SIDE.Sell,
    inverseEntryPrice: new BigNumber('0.000999900009999'),
    inverseLiquidationPrice: new BigNumber('0.00165023523758726073')
  }

  const expectOutput3: AccountComputed = {
    entryPrice: new BigNumber('1000.1'),
    positionValue: new BigNumber('16019.5'),
    positionMargin: new BigNumber('1601.95'),
    maintenanceMargin: new BigNumber('800.975'),
    socialLoss: new BigNumber('1.05'),
    fundingLoss: new BigNumber('-23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    pnl1: new BigNumber('-13719.27'),
    pnl2: new BigNumber('-13696.62634375'),
    roe: new BigNumber('-0.978330453125'),
    liquidationPrice: new BigNumber('6758.95389492753623188406'),
    marginBalance: new BigNumber('303.37365625'),
    maxWithdrawable: _0,
    availableMargin: _0,
    withdrawableBalance: _0,
    leverage: new BigNumber('52.80451901465983007547'),
    isSafe: false,
    inverseSide: SIDE.Buy,
    inverseEntryPrice: new BigNumber('0.0009999000099990001'),
    inverseLiquidationPrice: new BigNumber('0.00014795188952989909')
  }

  const expectOutput4: AccountComputed = {
    entryPrice: _0,
    positionValue: _0,
    positionMargin: _0,
    maintenanceMargin: _0,
    socialLoss: _0,
    fundingLoss: _0, // 9.9059375 * 2.3 -(-0.91)
    pnl1: _0,
    pnl2: _0,
    roe: _0,
    liquidationPrice: _0,
    marginBalance: new BigNumber('10000'),
    availableMargin: new BigNumber('10000'),
    maxWithdrawable: new BigNumber('10000'),
    withdrawableBalance: new BigNumber('10000'),
    leverage: _0,
    isSafe: true,
    inverseSide: SIDE.Flat,
    inverseEntryPrice: _0,
    inverseLiquidationPrice: _0
  }

  const successCases: Array<ComputeAccountCase> = [
    {
      accountStorage: accountStorage1,
      expectedOutput: expectOutput1
    },
    {
      accountStorage: accountStorage2,
      expectedOutput: expectOutput2
    },
    {
      accountStorage: accountStorage3,
      expectedOutput: expectOutput3
    },
    {
      accountStorage: accountStorage4,
      expectedOutput: expectOutput4
    }
  ]

  successCases.forEach((element, index) => {
    it(`computeAccount.${index}`, function () {
      const accountStorage = element.accountStorage
      const expectedOutput = element.expectedOutput
      const accountDetails = computeAccount(accountStorage, govParams, perpetualStorage, fundingResult)
      const computed = accountDetails.accountComputed
      expect(computed.entryPrice).toBeBigNumber(expectedOutput.entryPrice)
      expect(computed.positionValue).toBeBigNumber(expectedOutput.positionValue)
      expect(computed.positionMargin).toBeBigNumber(expectedOutput.positionMargin)
      expect(computed.maintenanceMargin).toBeBigNumber(expectedOutput.maintenanceMargin)
      expect(computed.socialLoss).toBeBigNumber(expectedOutput.socialLoss)
      expect(computed.fundingLoss).toBeBigNumber(expectedOutput.fundingLoss)
      expect(computed.pnl1).toBeBigNumber(expectedOutput.pnl1)
      expect(computed.pnl2).toBeBigNumber(expectedOutput.pnl2)
      expect(computed.roe).toBeBigNumber(expectedOutput.roe)
      expect(computed.liquidationPrice).toApproximate(expectedOutput.liquidationPrice)
      expect(computed.marginBalance).toBeBigNumber(expectedOutput.marginBalance)
      expect(computed.availableMargin).toBeBigNumber(expectedOutput.availableMargin)
      expect(computed.maxWithdrawable).toBeBigNumber(expectedOutput.maxWithdrawable)
      expect(computed.withdrawableBalance).toBeBigNumber(expectedOutput.withdrawableBalance)
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
}

const ammDetails = computeAMM(ammStorage, govParams, perpetualStorage, fundingResult)

describe('amm', function () {
  it('computeAMM', function () {
    //socialLoss: new BigNumber('0.13'),
    //fundingLoss: new BigNumber('23.69365625'), // 9.9059375 * 2.3 -(-0.91)
    // 10000 - 2300.23 - 0.13 - 23.69365625
    expect(ammDetails.ammComputed.availableMargin).toApproximate(new BigNumber('7675.94634375'))
    expect(ammDetails.ammComputed.fairPrice).toApproximate(new BigNumber('3337.36797554347826086957'))
    expect(ammDetails.ammComputed.inverseFairPrice).toApproximate(new BigNumber(1 / 3337.36797554347826086957))
  })

  it(`computeAMMPrice.buyTooLarge`, function () {
    expect((): void => {
      computeAMMPrice(ammDetails, TRADE_SIDE.Buy, 4)
    }).toThrow()
  })

  it(`computeAMMPrice.buy`, function () {
    const price = computeAMMPrice(ammDetails, TRADE_SIDE.Buy, 0.5)
    expect(price).toApproximate(new BigNumber('4264.414635416666667'))
  })

  it(`computeAMMPrice.sell`, function () {
    const price = computeAMMPrice(ammDetails, TRADE_SIDE.Sell, 0.5)
    expect(price).toApproximate(new BigNumber('2741.40940848214285714286'))
  })

  it(`computeAMMInversePrice.sellTooLarge`, function () {
    expect((): void => {
      computeAMMInversePrice(ammDetails, TRADE_SIDE.Sell, 4)
    }).toThrow()
  })

  it(`computeAMMInversePrice.buy`, function () {
    const price = computeAMMInversePrice(ammDetails, TRADE_SIDE.Buy, 0.5)
    expect(price).toApproximate(_1.div(new BigNumber('2741.40940848214285714286')))
  })

  it(`computeAMMInversePrice.sell`, function () {
    const price = computeAMMInversePrice(ammDetails, TRADE_SIDE.Sell, 0.5)
    expect(price).toApproximate(_1.div(new BigNumber('4264.414635416666667')))
  })

  it(`computeAMMAmount.buy`, function () {
    const amount = computeAMMAmount(ammDetails, TRADE_SIDE.Buy, '4264.414635416666667')
    expect(amount).toApproximate(new BigNumber('0.5'))
  })

  it(`computeAMMAmount.sell`, function () {
    const amount = computeAMMAmount(ammDetails, TRADE_SIDE.Sell, '2741.40940848214285714286')
    expect(amount).toApproximate(new BigNumber('0.5'))
  })

  it('computeAMMAmount.bad price', function () {
    expect((): void => {
      computeAMMAmount(ammDetails, TRADE_SIDE.Sell, '-1')
    }).toThrow()
  })

  it('computeAMMAmount.buy.lessThanFair', function () {
    expect((): void => {
      computeAMMAmount(ammDetails, TRADE_SIDE.Buy, ammDetails.ammComputed.fairPrice.times(0.99))
    }).toThrow()
  })

  it('computeAMMAmount.sell.greaterThanFair', function () {
    expect((): void => {
      computeAMMAmount(ammDetails, TRADE_SIDE.Sell, ammDetails.ammComputed.fairPrice.times(1.01))
    }).toThrow()
  })

  it(`computeAMMInverseAmount.buy`, function () {
    const amount = computeAMMInverseAmount(
      ammDetails,
      TRADE_SIDE.Buy,
      _1.div(new BigNumber('2741.40940848214285714286'))
    )
    expect(amount).toApproximate(new BigNumber('0.5'))
  })

  it(`computeAMMInverseAmount.sell`, function () {
    const amount = computeAMMInverseAmount(ammDetails, TRADE_SIDE.Sell, _1.div(new BigNumber('4264.414635416666667')))
    expect(amount).toApproximate(new BigNumber('0.5'))
  })
})

describe('computeTrade.Fail', function () {
  it('decrease.FlatSide', function () {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage4, new BigNumber(7000), _1)
    }).toThrow()
  })

  it('decrease.ZeroPrice', function () {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _0, _1)
    }).toThrow()
  })

  it('decrease.ZeroAmount', function () {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _1, _0)
    }).toThrow()
  })

  it('decrease.LargeAmount', function () {
    expect((): void => {
      computeDecreasePosition(perpetualStorage, fundingResult, accountStorage1, _1, _1000)
    }).toThrow()
  })

  it('increase.BadSide', function () {
    expect((): void => {
      computeIncreasePosition(
        perpetualStorage,
        fundingResult,
        accountStorage1,
        TRADE_SIDE.Sell,
        new BigNumber(7000),
        _1
      )
    }).toThrow()
  })

  it('increase.ZeroPrice', function () {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, TRADE_SIDE.Buy, _0, _1)
    }).toThrow()
  })

  it('increase.ZeroAmount', function () {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, TRADE_SIDE.Buy, _1, _0)
    }).toThrow()
  })

  it('increase.BadSide', function () {
    expect((): void => {
      computeIncreasePosition(perpetualStorage, fundingResult, accountStorage1, TRADE_SIDE.Sell, _1, _0)
    }).toThrow()
  })

  it('fee.ZeroPrice', function () {
    expect((): void => {
      computeFee(0, 1, 0.1)
    }).toThrow()
  })

  it('fee.ZeroAmount', function () {
    expect((): void => {
      computeFee(1, 0, 0.1)
    }).toThrow()
  })

  it('tradeCost.ZeroAmount', function () {
    expect((): void => {
      computeTradeCost(govParams, perpetualStorage, fundingResult, accountDetails1, TRADE_SIDE.Buy, _1, _0, _1, _0_01)
    }).toThrow()
  })

  it('tradeCost.ZeroPrice', function () {
    expect((): void => {
      computeTradeCost(govParams, perpetualStorage, fundingResult, accountDetails1, TRADE_SIDE.Buy, _0, _1, _1, _0_01)
    }).toThrow()
  })

  it('tradeCost.BadLev', function () {
    const negatedOne = _1.negated()
    expect((): void => {
      computeTradeCost(
        govParams,
        perpetualStorage,
        fundingResult,
        accountDetails1,
        TRADE_SIDE.Buy,
        _1,
        _1,
        negatedOne,
        _0_01
      )
    }).toThrow()
  })
})

describe('computeTradeCost', function () {
  interface TradeCostCase {
    name: string
    input: {
      accountDetails: AccountDetails
      side: TRADE_SIDE
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
  //fundingResult.accumulatedFundingPerContract = 9.9059375
  //fundingResult.markPrice = 6965
  //new BigNumber('23694.9847500349122')
  const tradeCostCases: Array<TradeCostCase> = [
    {
      name: 'increase long',
      input: {
        accountDetails: accountDetails1,
        side: TRADE_SIDE.Buy,
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
            (6965 * 3.3 - 4300.23) -
            (0.1 * 3.3 - 0.2) -
            (9.9059375 * 3.3 - 8.9959375),
          */
          marginBalance: '28640.44634375',
          positionSide: SIDE.Buy,
          positionSize: '3.3',
          entryValue: '4300.23',
          entrySocialLoss: '0.2',
          entryFundingLoss: '8.9959375'
        },
        marginCost: '-17148.19634375',
        fee: 20
      }
    },
    {
      name: 'increase long with leverage cost',
      input: {
        accountDetails: accountDetails1,
        side: TRADE_SIDE.Buy,
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
            (6965 * 7.3 - 37300.23) -
            (0.1 * 7.3 - 0.6) -
            (9.9059375 * 7.3 - 48.6196875),
          */
          marginBalance: '23170.44634375',
          positionSide: SIDE.Buy,
          positionSize: '7.3',
          entryValue: '37300.23',
          entrySocialLoss: '0.6',
          entryFundingLoss: '48.6196875'
        },
        /*  6965 * 7.3 / 2 -23170.44634375 */
        marginCost: '2251.80365625',
        fee: 350
      }
    },
    {
      name: 'increase long with loss',
      input: {
        accountDetails: accountDetails1,
        side: TRADE_SIDE.Buy,
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
            (6965 * 12.3 - 102300.23) -
            (0.1 * 12.3 - 1.1) -
            (9.9059375 * 12.3 - 98.149375),
          */
          marginBalance: '-7654.55365625',
          positionSide: SIDE.Buy,
          positionSize: '12.3',
          entryValue: '102300.23',
          entrySocialLoss: '1.1',
          entryFundingLoss: '98.149375'
        },
        marginCost: '16221.50365625',
        fee: 1000
      }
    },
    {
      name: 'decrease long',
      input: {
        accountDetails: accountDetails1,
        side: TRADE_SIDE.Sell,
        price: 2000,
        amount: 1,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 999.9 - 20 - (0.1 - 0.1/2.3) * 1 - (9.9059375 - (-0.91)/2.3 ) * 1
          cashBalance: '10969.54188858695652173913',
          positionSide: SIDE.Buy,
          positionSize: '1.3',
          entryValue: '1300.13',
          entrySocialLoss: '0.0565217391304',
          entryFundingLoss: '-0.514347826087',
          /*
            10969.54188858695652173913 +
            (6965 * 1.3 - 1300.13) -
            (0.1 * 1.3 - 0.0565217391304) -
            (9.9059375 * 1.3 - (-0.514347826087)),
          */
          marginBalance: '18710.44634375'
        },
        marginCost: '-14183.19634375',
        fee: 20
      }
    },
    {
      name: 'decrease long to zero',
      input: {
        accountDetails: accountDetails1,
        side: TRADE_SIDE.Sell,
        price: 2000,
        amount: 2.3,
        leverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 2299.77‬ - 46 - (0.1 * 2.3 - 0.1) - (9.9059375 * 2.3 - (-0.91))
          cashBalance: '12229.94634375',
          positionSide: SIDE.Flat,
          positionSize: 0,
          entryValue: 0,
          entrySocialLoss: 0,
          entryFundingLoss: 0,
          marginBalance: '12229.94634375'
        },
        marginCost: 0,
        fee: 46
      }
    },
    {
      name: 'decrease long to short',
      input: {
        accountDetails: accountDetails1,
        side: TRADE_SIDE.Sell,
        price: 2000,
        amount: 3.3,
        leverage: 1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 10000 + 2299.77‬ - 66 - (0.1 * 2.3 - 0.1) - (9.9059375 * 2.3 - (-0.91))
          cashBalance: '12209.94634375',
          positionSide: SIDE.Sell,
          positionSize: 1,
          entryValue: 2000,
          entrySocialLoss: '0.5',
          entryFundingLoss: '9.9059375',
          /*
            12209.94634375 + (2000 - 6965 * 1)
          */
          marginBalance: '7244.94634375'
        },
        marginCost: '-279.946343749999999999999',
        fee: 66
      }
    },
    {
      name: 'increase zero to long with cost',
      input: {
        accountDetails: accountDetails4,
        side: TRADE_SIDE.Buy,
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
          entryFundingLoss: '19.811875',
          /*
            9860 + (6965 * 2 - 14000)
          */
          marginBalance: '9790'
        },
        marginCost: 4140,
        fee: 140
      }
    },
    {
      name: 'decrease zero to short with cost',
      input: {
        accountDetails: accountDetails4,
        side: TRADE_SIDE.Sell,
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
          entryFundingLoss: '19.811875',
          /*
            9860 + (14000-6965 * 2)
          */
          marginBalance: '9930'
        },
        marginCost: '4000',
        fee: 140
      }
    },
    {
      name: 'decrease short',
      input: {
        accountDetails: accountDetails3,
        side: TRADE_SIDE.Buy,
        price: 2000,
        amount: 1,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 999.9 - 20 - (0.5 - 0.1/2.3) * 1 + (9.9059375 - (-0.91)/2.3 ) * 1
          cashBalance: '12989.94506793478260869',
          positionSide: SIDE.Sell,
          positionSize: '1.3',
          entryValue: '1300.13',
          entrySocialLoss: '0.0565217391304',
          entryFundingLoss: '-0.514347826087',
          /*
            12,989.94506793478260869 +
            (1300.13 - 6965 * 1.3) -
            (0.5 * 1.3 - 0.0565217391304)
            + (9.9059375 * 1.3 - (-0.514347826087)),
          */
          marginBalance: '5248.37365625'
        },
        marginCost: '-721.12365625',
        fee: 20
      }
    },
    {
      name: 'decrease short to zero',
      input: {
        accountDetails: accountDetails3,
        side: TRADE_SIDE.Buy,
        price: 2000,
        amount: 2.3,
        leverage: 2,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 2299.77 - 46 - (0.5 * 2.3 - 0.1) + (9.9059375 * 2.3 - (-0.91))
          cashBalance: '11676.87365625',
          positionSide: SIDE.Flat,
          positionSize: 0,
          entryValue: 0,
          entrySocialLoss: 0,
          entryFundingLoss: 0,
          marginBalance: '11676.87365625'
        },
        marginCost: 0,
        fee: 46
      }
    },
    {
      name: 'decrease short to long with leverage',
      input: {
        accountDetails: accountDetails3,
        side: TRADE_SIDE.Buy,
        price: 2000,
        amount: 3.3,
        leverage: 0.1,
        feeRate: 0.01
      },
      expectedOutput: {
        account: {
          // 14000 - 2299.77 - 66 - (0.5 * 2.3 - 0.1) + (9.9059375 * 2.3 - (-0.91))
          cashBalance: '11656.87365625',
          positionSide: SIDE.Buy,
          positionSize: 1,
          entryValue: 2000,
          entrySocialLoss: '0.1',
          entryFundingLoss: '9.9059375',
          // 11656.87365625 + (6965-2000) * 1
          marginBalance: '16621.87365625'
        },
        marginCost: '53028.12634375',
        fee: 66
      }
    }
  ]

  tradeCostCases.forEach(element => {
    const input = element.input
    const name = element.name
    const expectedOutput = element.expectedOutput

    it(`tradeCost[${name}]`, function () {
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

  it(`computeAMMTradeCost.Buy`, function () {
    const ammCost = computeAMMTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      TRADE_SIDE.Buy,
      0.5,
      0.5
    )
    expect(ammCost.estimatedPrice).toApproximate(new BigNumber('4264.41463541666666666667'))
    expect(ammCost.limitPrice).toApproximate(new BigNumber('4264.41463541666666666667'))
    expect(ammCost.limitSlippage).toBeBigNumber(_0)
    expect(ammCost.marginCost).toApproximate(new BigNumber('13963.5914922526041666666683375'))
  })

  it(`computeAMMTradeCost.Buy.Slippage`, function () {
    const ammCost = computeAMMTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      TRADE_SIDE.Buy,
      0.5,
      0.5,
      0.01
    )
    expect(ammCost.estimatedPrice).toApproximate(new BigNumber('4264.41463541666666666667'))
    expect(ammCost.limitPrice).toApproximate(new BigNumber('4307.0587817708333333333367'))
    expect(ammCost.limitSlippage).toBeBigNumber(_0_01)
    expect(ammCost.marginCost).toApproximate(new BigNumber('13984.966870612630208333335020875'))
  })

  it(`computeAMMTradeCost.Sell`, function () {
    const ammCost = computeAMMTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      TRADE_SIDE.Sell,
      0.5,
      0.5
    )
    expect(ammCost.estimatedPrice).toApproximate(new BigNumber('2741.40940848214286'))
    expect(ammCost.marginCost).toApproximate(new BigNumber('3493.7757137695312480873222625'))
  })

  it(`computeAMMTradeCost.Sell`, function () {
    const ammCost = computeAMMTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      TRADE_SIDE.Sell,
      0.5,
      0.5,
      0.01
    )
    expect(ammCost.estimatedPrice).toApproximate(new BigNumber('2741.40940848214286'))
    expect(ammCost.limitPrice).toApproximate(new BigNumber('2713.9953143973214285714314'))
    expect(ammCost.limitSlippage).toBeBigNumber(_0_01)
    expect(ammCost.marginCost).toApproximate(new BigNumber('3507.44849319433593750000358925'))
  })

  it(`computeAMMInverseTradeCost.Buy`, function () {
    const ammCost = computeAMMInverseTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      TRADE_SIDE.Buy,
      0.5,
      0.5
    )
    expect(ammCost.estimatedPrice).toApproximate(_1.div(new BigNumber('2741.40940848214286')))
    expect(ammCost.marginCost).toApproximate(new BigNumber('3493.775713769531250000003575'))
  })

  it(`computeAMMInverseTradeCost.Buy.Slippage`, function () {
    const ammCost = computeAMMInverseTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      TRADE_SIDE.Buy,
      0.5,
      0.5,
      0.01
    )
    expect(ammCost.estimatedPrice).toApproximate(_1.div(new BigNumber('2741.40940848214286')))
    expect(ammCost.limitPrice).toApproximate(_1.div(new BigNumber('2741.40940848214286')).times(1.01))
    expect(ammCost.marginCost).toApproximate(new BigNumber('3507.3131191406249981062619375'))
  })

  it(`computeAMMInverseTradeCost.Sell`, function () {
    const ammCost = computeAMMInverseTradeCost(
      ammDetails,
      govParams,
      perpetualStorage,
      fundingResult,
      accountDetails1,
      TRADE_SIDE.Sell,
      0.5,
      0.5
    )
    expect(ammCost.estimatedPrice).toApproximate(_1.div(new BigNumber('4264.41463541666661')))
    expect(ammCost.limitPrice).toApproximate(_1.div(new BigNumber('4264.41463541666661')))
    expect(ammCost.limitSlippage).toBeBigNumber(_0)
    expect(ammCost.marginCost).toApproximate(new BigNumber('13963.5914922526041371020461'))
  })

  it('computeAMMTradeCost.Buy.BadSlippage', function () {
    expect((): void => {
      computeAMMTradeCost(
        ammDetails,
        govParams,
        perpetualStorage,
        fundingResult,
        accountDetails1,
        TRADE_SIDE.Buy,
        0.5,
        0.5,
        '-1'
      )
    }).toThrow()
  })

  it('computeAMMInverseTradeCost.Sell.BadSlippage', function () {
    expect((): void => {
      computeAMMInverseTradeCost(
        ammDetails,
        govParams,
        perpetualStorage,
        fundingResult,
        accountDetails1,
        TRADE_SIDE.Sell,
        0.5,
        0.5,
        1
      )
    }).toThrow()
  })
})

describe('computeDepositByLeverage', function () {
  it('bad leverage', function () {
    expect((): void => {
      computeDepositByLeverage(accountDetails1, fundingResult, -1)
    }).toThrow()
  })

  it('positive', function () {
    const deposit = computeDepositByLeverage(accountDetails1, fundingResult, 0.5)
    expect(deposit).toApproximate(new BigNumber('8343.55365625'))
  })

  it('negative', function () {
    const deposit = computeDepositByLeverage(accountDetails1, fundingResult, 10)
    expect(deposit).toApproximate(new BigNumber('-22093.49634375'))
  })
})

describe('calculateLiquidateAmount', function () {
  interface LiquidateAmountCase {
    name: string
    input: {
      accountStorage: AccountStorage
      liquidationPrice: BigNumber
    }
    expectedOutput: BigNumberish
  }

  const cases: Array<LiquidateAmountCase> = [
    {
      name: 'long - price 1',
      input: { accountStorage: accountStorage2, liquidationPrice: new BigNumber('700') },
      expectedOutput: new BigNumber('0')
    },
    {
      name: 'long - price 2',
      input: { accountStorage: accountStorage2, liquidationPrice: new BigNumber('600') },
      expectedOutput: new BigNumber('1.519512152777780224')

    },
    {
      name: 'long - price 3',
      input: { accountStorage: accountStorage2, liquidationPrice: new BigNumber('550') },
      expectedOutput: new BigNumber('2.3')
    },
    {
      name: 'short - price 1',
      input: { accountStorage: accountStorage3, liquidationPrice: new BigNumber('6000') },
      expectedOutput: new BigNumber('0')
    },
    {
      name: 'short - price 2',
      input: { accountStorage: accountStorage3, liquidationPrice: new BigNumber('6700') },
      expectedOutput: new BigNumber('1.041668895107794361')
    },
    {
      name: 'short - price 3',
      input: { accountStorage: accountStorage3, liquidationPrice: new BigNumber('7500') },
      expectedOutput: new BigNumber('2.3')
    },
  ]

  cases.forEach(element => {
    const input = element.input
    const name = element.name
    const expectedOutput = element.expectedOutput

    it(`calculateLiquidateAmount[${name}]`, function () {
      const liquidateAmount = calculateLiquidateAmount(
        input.accountStorage,
        govParams,
        perpetualStorage,
        fundingResult,
        input.liquidationPrice,
      )
      expect(liquidateAmount).toApproximate(
        normalizeBigNumberish(expectedOutput)
      )
    })
  })
})


describe('calculateLiquidate', function () {
  it(`partial liquidate & add social loss`, function () {
    const govParams2 = {
      ...govParams
    }
    govParams2.lotSize = new BigNumber('0.5')
    const fundingParams = {
      accumulatedFundingPerContract: _0,
      lastEMAPremium: _0,
      lastPremium: _0,
      lastIndexPrice: new BigNumber('5000'),
      lastFundingTimestamp: timestamp
    }
    const perpetualStorage = {
      collateralTokenAddress: 'xxxx',
      totalSize: new BigNumber('1'),
      longSocialLossPerContract: _0,
      shortSocialLossPerContract: _0,
      insuranceFundBalance: _0,
      isEmergency: false,
      isGlobalSettled: false,
      globalSettlePrice: _0,
      isPaused: false,
      isWithdrawDisabled: false,
      oraclePrice: new BigNumber('5000'),
      oracleTimestamp: timestamp,
      shareTokenAddress: '',
      ...fundingParams
    }
    const fundingResult = computeFunding(perpetualStorage, govParams2, timestamp)
    const r1 = computeLiquidate(
      {
        perpetualStorage,
        liquidated: {
          cashBalance: new BigNumber('1000'),
          positionSide: SIDE.Buy,
          positionSize: new BigNumber('1'),
          entryValue: new BigNumber('7000'),
          entrySocialLoss: _0,
          entryFundingLoss: _0,
        },
        keeper: {
          cashBalance: new BigNumber('1000'),
          positionSide: SIDE.Flat,
          positionSize: _0,
          entryValue: _0,
          entrySocialLoss: _0,
          entryFundingLoss: _0,
        }
      },
      govParams2,
      fundingResult,
      new BigNumber('0.5')
    )
    expect(r1.perpetualStorage.insuranceFundBalance).toEqual(_0)
    expect(r1.perpetualStorage.longSocialLossPerContract).toEqual(_0)
    expect(r1.perpetualStorage.shortSocialLossPerContract).toEqual(new BigNumber('12.5'))
    expect(r1.liquidated.cashBalance).toEqual(_0)
    expect(r1.liquidated.positionSize).toEqual(new BigNumber('0.5'))
    expect(r1.keeper.cashBalance).toEqual(new BigNumber('1012.5'))
    expect(r1.keeper.positionSize).toEqual(new BigNumber('0.5'))

    const r2 = computeLiquidate(r1, govParams2, fundingResult, new BigNumber('0.5'))
    expect(r2.perpetualStorage.insuranceFundBalance).toEqual(_0)
    expect(r2.perpetualStorage.shortSocialLossPerContract).toEqual(new BigNumber('1025'))
    expect(r2.liquidated.cashBalance).toEqual(_0)
    expect(r2.liquidated.positionSize).toEqual(_0)
    expect(r2.keeper.cashBalance).toEqual(new BigNumber('1025'))
    expect(r2.keeper.positionSize).toEqual(new BigNumber('1'))
  })

  it(`normal - short position`, function () {
    const govParams2 = {
      ...govParams
    }
    govParams2.lotSize = new BigNumber('0.5')
    const fundingParams = {
      accumulatedFundingPerContract: _0,
      lastEMAPremium: _0,
      lastPremium: _0,
      lastIndexPrice: new BigNumber('7800'),
      lastFundingTimestamp: timestamp
    }
    const perpetualStorage = {
      collateralTokenAddress: 'xxxx',
      totalSize: new BigNumber('1'),
      longSocialLossPerContract: _0,
      shortSocialLossPerContract: _0,
      insuranceFundBalance: _0,
      isEmergency: false,
      isGlobalSettled: false,
      globalSettlePrice: _0,
      isPaused: false,
      isWithdrawDisabled: false,
      oraclePrice: new BigNumber('7800'),
      oracleTimestamp: timestamp,
      shareTokenAddress: '',
      ...fundingParams
    }
    const fundingResult = computeFunding(perpetualStorage, govParams2, timestamp)
    const r1 = computeLiquidate(
      {
        perpetualStorage,
        liquidated: {
          cashBalance: new BigNumber('1000'),
          positionSide: SIDE.Sell,
          positionSize: new BigNumber('1'),
          entryValue: new BigNumber('7000'),
          entrySocialLoss: _0,
          entryFundingLoss: _0,
        },
        keeper: {
          cashBalance: new BigNumber('2000'),
          positionSide: SIDE.Buy,
          positionSize: new BigNumber('0.5'),
          entryValue: new BigNumber('3500'),
          entrySocialLoss: _0,
          entryFundingLoss: _0,
        }
      },
      govParams2,
      fundingResult,
      new BigNumber('0.5')
    )
    expect(r1.perpetualStorage.insuranceFundBalance).toEqual(new BigNumber(19.5))
    expect(r1.perpetualStorage.longSocialLossPerContract).toEqual(_0)
    expect(r1.perpetualStorage.shortSocialLossPerContract).toEqual(_0)
    expect(r1.keeper.cashBalance).toEqual(new BigNumber('2419.5'))
    expect(r1.keeper.positionSize).toEqual(_0)
  })
})