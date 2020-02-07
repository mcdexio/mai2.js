import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { BigNumberish } from '../src/types'
import { bigLn, normalizeBigNumberish, getEthToken, isNetworkId, isLowLevelProvider, bigPowi } from '../src/utils'
import { ETH, SUPPORTED_NETWORK_ID, _0 } from '../src/constants'

import { extendExpect } from './helper'

extendExpect()

describe('isNetworkId', function() {
  it('mainnet id', function() {
    expect(isNetworkId(SUPPORTED_NETWORK_ID.Mainnet)).toBeTruthy()
  })

  it('provider', function() {
    const provider = ethers.getDefaultProvider()
    expect(isNetworkId(provider)).toBeFalsy()
  })
})

describe('isLowLevelProvider', function() {
  it('mainnet id', function() {
    expect(isLowLevelProvider(SUPPORTED_NETWORK_ID.Mainnet)).toBeFalsy()
  })
  it('provider', function() {
    const provider = ethers.getDefaultProvider()
    expect(isLowLevelProvider(provider)).toBeFalsy()
  })
})

describe('bigLn', function() {
  it('ln1.9', function() {
    const i = bigLn(new BigNumber('1.975308642024691356'))
    expect(i).toApproximate(new BigNumber('0.680724660586388155'))
  })
  it('ln0.9', function() {
    const i = bigLn(new BigNumber('0.987654321012345678'))
    expect(i).toApproximate(new BigNumber('-0.012422519973557154'))
  })
  it('ln1', function() {
    const i = bigLn(new BigNumber('1'))
    expect(i).toBeBigNumber(_0)
  })
  it('ln0.1', function() {
    const i = bigLn(new BigNumber('0.1'))
    expect(i).toApproximate(new BigNumber('-2.302585092994045684'))
  })
  it('ln0.5', function() {
    const i = bigLn(new BigNumber('0.5'))
    expect(i).toApproximate(new BigNumber('-0.693147180559945309'))
  })
  it('ln3', function() {
    const i = bigLn(new BigNumber('3'))
    expect(i).toApproximate(new BigNumber('1.098612288668109691'))
  })
  it('ln10', function() {
    const i = bigLn(new BigNumber('10'))
    expect(i).toApproximate(new BigNumber('2.302585092994045684'))
  })
  it('ln1.2345', function() {
    const i = bigLn(new BigNumber('1.2345'))
    expect(i).toApproximate(new BigNumber('0.210666029803097141'))
  })
})

describe('bigPowi', function() {
  const cases = [
    [ '2312.112284812121238', 1 ],
    [ '2312.112284812121238', 0 ],
    [ '2312.112284812121238', 2 ],
    [ '2312.112284812121238', 3 ],
    [ '0.9999999', 100000 ],
    [ '0.9999999', 1000000 ],
    [ '0.9999999', 10000000 ]
  ]

  cases.forEach((i) => {
    const p = normalizeBigNumberish(i[0])
    const n = normalizeBigNumberish(i[1])
    it(`pow(${p}, ${n})`, () => {
      BigNumber.config({ POW_PRECISION: 18 })
      const e = p.pow(n).dp(8, BigNumber.ROUND_DOWN)
      const i = bigPowi(p, n).dp(8, BigNumber.ROUND_DOWN)
      expect(i).toBeBigNumber(e)
    })
  })

  it('float n', function() {
    expect((): void => {
      bigPowi(normalizeBigNumberish('1.22'), normalizeBigNumberish('1.5'))
    }).toThrow()
  })
})

interface TestCase {
  input: BigNumberish
  expectedOutput: BigNumber
}

function constructTestCase(input: BigNumberish, expectedOutput: BigNumber): TestCase {
  return { input, expectedOutput }
}

function testSuccesses(expectedSuccesses: TestCase[]): void {
  test('failures', (): void => {
    expectedSuccesses.forEach(({ input, expectedOutput }: TestCase): void => {
      const output: BigNumber = normalizeBigNumberish(input)
      expect(output.isEqualTo(expectedOutput)).toBe(true)
    })
  })
}

function testFailures(expectedFailures: BigNumberish[]): void {
  test('failures', (): void => {
    expectedFailures.forEach((expectedFailure: BigNumberish): void => {
      expect((): void => {
        normalizeBigNumberish(expectedFailure)
      }).toThrow()
    })
  })
}

describe('normalizeBigNumberish', (): void => {
  describe('string', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase('0', new BigNumber('0')),
      constructTestCase('1', new BigNumber('1')),
      constructTestCase('1.234', new BigNumber('1.234'))
    ]
    const expectedFailures: string[] = [ '.', ',', 'a', '0.0.' ]

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })

  describe('number', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase(0, new BigNumber('0')),
      constructTestCase(1, new BigNumber('1')),
      constructTestCase(1.234, new BigNumber('1.234'))
    ]
    const expectedFailures: number[] = [ NaN, Infinity ]

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })

  describe('BigNumber', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase(new BigNumber(0), new BigNumber('0')),
      constructTestCase(new BigNumber(1), new BigNumber('1')),
      constructTestCase(new BigNumber('1.234'), new BigNumber('1.234'))
    ]
    const expectedFailures: BigNumber[] = [ new BigNumber(NaN) ]

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })

  describe('ethers.utils.BigNumber', (): void => {
    const expectedSuccesses: TestCase[] = [
      constructTestCase(ethers.constants.Zero, new BigNumber('0')),
      constructTestCase(ethers.constants.One, new BigNumber('1')),
      constructTestCase(ethers.utils.bigNumberify('1234'), new BigNumber('1234')),
      constructTestCase(ethers.utils.parseUnits('1.234', 3), new BigNumber('1234'))
    ]
    const expectedFailures: ethers.utils.BigNumber[] = []

    testSuccesses(expectedSuccesses)
    testFailures(expectedFailures)
  })
})

test('getEthToken', (): void => {
  expect(getEthToken(1).address).toEqual(ETH)
})
