import BigNumber from 'bignumber.js'

import { getContract } from '../src/utils'
import { getPerpetualContract, getAMMContract } from '../src/transact'
import { ammCreatePool } from '../src/transact'

import { testU2, testU7, testDev } from './eth_address'

const MINTABLE_ERC20_ABI =
  '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"whitelist","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint8"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[{"name":"who","type":"address"},{"name":"enable","type":"bool"}],"name":"setWhitelist","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]'

const weis = new BigNumber('1000000000000000000')
const infinity = '999999999999999999999999999999999999999999'

const toWad = (x: any) => {
  return new BigNumber(x).times(weis).toFixed()
}

const getTestToken = async (address: string, operator: string, provider: any) => {
  let testToken = await getContract(address, MINTABLE_ERC20_ABI)
  return testToken.connect(provider.getSigner(operator))
}

// approve_test_token as u2
export const approvePerp = async (addresses: any, operator: string, rpcProvider: any) => {
  let testToken = await getTestToken(addresses.testToken, operator, rpcProvider)

  const allowance = new BigNumber(await testToken.allowance(operator, addresses.perp))
  if (allowance.eq('0')) {
    await testToken.approve(addresses.perp, infinity)
    console.log('> perp approved')
  }
}

// mint_test_token as admin
export const mintTestToken = async (addresses: any, operator: string, rpcProvider: any) => {
  let testToken = await getTestToken(addresses.testToken, operator, rpcProvider)

  await testToken.mint(testU7, toWad(1000000 * 3 * (1 / 120)))
  await testToken.mint(testU2, toWad(70000))
  await testToken.mint(testDev, toWad(10000)) // for updateIndex prize
  await testToken.mint('0xAE7E0DE83bDac11fd01D56fF09e9E7d02CA9b6A9', toWad(70000)) // ji
  await testToken.mint('0x31Ebd457b999Bf99759602f5Ece5AA5033CB56B3', toWad(70000)) // jie

  console.log('> token minted')
}

// create_pool_for_test_token as u7
export const createPoolForTestToken = async (addresses: any, operator: string, rpcProvider: any) => {
  let perp = await getPerpetualContract(addresses.perp, rpcProvider)
  perp = perp.connect(rpcProvider.getSigner(operator))
  let amm = await getAMMContract(addresses.amm, rpcProvider)
  amm = amm.connect(rpcProvider.getSigner(operator))

  await approvePerp(addresses, operator, rpcProvider)
  await ammCreatePool(amm, 1000000)

  console.log('> pool created')
}

// create_pool_for_eth as u7
export const createPoolForETH = async (addresses: any, operator: string, rpcProvider: any) => {
  let perp = await getPerpetualContract(addresses.perp, rpcProvider)
  perp = perp.connect(rpcProvider.getSigner(operator))
  let amm = await getAMMContract(addresses.amm, rpcProvider)
  amm = amm.connect(rpcProvider.getSigner(operator))

  await ammCreatePool(amm, 1000000)

  console.log('   > pool created')
}

export const isPoolEmpty = async (addresses: any, rpcProvider: any) => {
  const amm = await getAMMContract(addresses.amm, rpcProvider)
  const size = new BigNumber(await amm.positionSize())
  return size.eq('0')
}
