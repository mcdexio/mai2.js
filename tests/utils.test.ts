import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { BigNumberish } from '../src/types'
import { bigLn, normalizeBigNumberish, getEthToken, isNetworkId, isLowLevelProvider } from '../src/utils'
import { ETH, SUPPORTED_NETWORK_ID } from '../src/constants'

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
    expect(isLowLevelProvider(provider)).toBeTruthy()
  })
})

describe('bigLn', function() {
  const expectError = new BigNumber('10e-18')
  it('ln1.9', function() {
    const i = bigLn(new BigNumber('1.975308642024691356'))
    const err = new BigNumber(i).minus('0.680724660586388155').abs()
    expect(err.isLessThan(expectError)).toBeTruthy()
  })
  it('ln0.9', function() {
    const i = bigLn(new BigNumber('0.987654321012345678'))
    const err = new BigNumber(i).minus('-0.012422519973557154').abs()
    expect(err.isLessThan(expectError)).toBeTruthy()
  })
  it('ln1', function() {
    const i = bigLn(new BigNumber('1'))
    expect(i.toString()).toEqual('0')
  })
  it('ln0.1', function() {
    const i = bigLn(new BigNumber('0.1'))
    const err = new BigNumber(i).minus('-2.302585092994045684').abs()
    expect(err.isLessThan(expectError)).toBeTruthy()
  })
  it('ln0.5', function() {
    const i = bigLn(new BigNumber('0.5'))
    const err = new BigNumber(i).minus('-0.693147180559945309').abs()
    expect(err.isLessThan(expectError)).toBeTruthy()
  })
  it('ln3', function() {
    const i = bigLn(new BigNumber('3'))
    const err = new BigNumber(i).minus('1.098612288668109691').abs()
    expect(err.isLessThan(expectError)).toBeTruthy()
  })
  it('ln10', function() {
    const i = bigLn(new BigNumber('10'))
    const err = new BigNumber(i).minus('2.302585092994045684').abs()
    expect(err.isLessThan(expectError)).toBeTruthy()
  })
  it('ln1.2345', function() {
    const i = bigLn(new BigNumber('1.2345'))
    const err = new BigNumber(i).minus('0.210666029803097141').abs()
    expect(err.isLessThan(expectError)).toBeTruthy()
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
