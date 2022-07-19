import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
	takeSnapshot,
	SnapshotRestorer,
} from '@nomicfoundation/hardhat-network-helpers'
import { BIdolNFT } from '../typechain-types'

describe('Example', () => {
	let idol: BIdolNFT
	let snapshot: SnapshotRestorer
	before(async () => {
		const factory = await ethers.getContractFactory('BIdolNFT')
		idol = (await factory.deploy()) as BIdolNFT
		await idol.deployed()
		await idol.initialize()
	})
	beforeEach(async () => {
		snapshot = await takeSnapshot()
	})
	afterEach(async () => {
		await snapshot.restore()
	})
	describe('name', () => {
		it('check name', async () => {
			const value = await idol.name()
			expect(value.toString()).to.equal('B-idol')
		})
	})
	describe('symbol', () => {
		it('check symbol', async () => {
			const symbol = await idol.symbol()
			expect(symbol.toString()).to.equal('P-BIDOL')
		})
	})
})
