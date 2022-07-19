import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Wallet } from 'ethers'
import {
	takeSnapshot,
	SnapshotRestorer,
} from '@nomicfoundation/hardhat-network-helpers'
import { BIdolNFT, SupportInterfaceTest } from '../typechain-types'
import { MerkleTree } from 'merkletreejs'

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
	describe('supportsInterface', () => {
		let interfaceIdTest: SupportInterfaceTest
		before(async () => {
			const factory = await ethers.getContractFactory('SupportInterfaceTest')
			interfaceIdTest = (await factory.deploy()) as SupportInterfaceTest
			await interfaceIdTest.deployed()
		})
		describe('success', () => {
			it('BIdolNFT', async () => {
				const interfaceId = await interfaceIdTest.getBIdolNFTId()
				const result = await idol.supportsInterface(interfaceId)
				expect(result).to.equal(true)
			})
			it('ERC2981Upgradeable', async () => {
				const interfaceId = await interfaceIdTest.getERC2981UpgradeableId()
				const result = await idol.supportsInterface(interfaceId)
				expect(result).to.equal(true)
			})
			it('ERC721AUpgradeable', async () => {
				const result = await idol.supportsInterface('0x80ac58cd')
				expect(result).to.equal(true)
			})
			it('ERC1822ProxiableUpgradeable', async () => {
				const interfaceId =
					await interfaceIdTest.getERC1822ProxiableUpgradeableId()
				const result = await idol.supportsInterface(interfaceId)
				expect(result).to.equal(true)
			})
			it('dummy', async () => {
				const result = await idol.supportsInterface('0x12341234')
				expect(result).to.equal(false)
			})
		})
	})
	describe('tokenURI', () => {
		before(async () => {
			const tmp = Wallet.createRandom()
			await idol.mintByOwner(tmp.address, 3)
		})
		describe('get token uri', () => {
			it('name', async () => {
				const uri = await idol.tokenURI(1)
				console.log(uri)
				const uriObj = JSON.parse(uri)
				expect(uriObj.name).to.equal('Project B-idol')
			})
			it('description', async () => {
				const uri = await idol.tokenURI(2)
				const uriObj = JSON.parse(uri)
				expect(uriObj.description).to.equal(
					"Your support will create their future! 'Project B-idol', a new generation of Web3 digital idols by blockchain technology 'Project B-idol' is a digital idol project being developed as NFT. The girls, who aim to become miraculous 'Super Idols', will be active in the blockchain world!"
				)
			})
			it('image', async () => {
				const uri = await idol.tokenURI(0)
				const uriObj = JSON.parse(uri)
				expect(uriObj.image).to.equal('https://hogehoge/0.jpg')
			})
		})
		describe('fail', () => {
			it('not exist', async () => {
				await expect(idol.tokenURI(5)).to.be.revertedWithCustomError(
					idol,
					'URIQueryForNonexistentToken'
				)
			})
		})
	})
	describe('mintWhiteList', () => {
		let merkleProof: string[]
		let tree: MerkleTree
		const padBuffer = (addr: string) =>
			Buffer.from(addr.substr(2).padStart(32 * 2, '0'), 'hex')
		before(async () => {
			const accounts = await ethers.getSigners()
			const whitelisted = accounts.slice(0, 5)
			const leaves = whitelisted.map((account) => padBuffer(account.address))
			tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true })
			const merkleRoot = tree.getHexRoot()
			await idol.setMerkleRoot(merkleRoot)
			merkleProof = tree.getHexProof(padBuffer(whitelisted[0].address))
		})
		describe('success', () => {
			it('claimed flg was set', async () => {
				const account = await ethers.getSigners()
				const before = await idol.claimed(account[0].address)
				expect(before).to.equal(false)
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				const after = await idol.claimed(account[0].address)
				expect(after).to.equal(true)
			})
			it('totalValue was set', async () => {
				const before = await idol.totalValue()
				expect(before.toString()).to.equal('0')
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				const after = await idol.totalValue()
				expect(after.toString()).to.equal(
					ethers.utils.parseEther('0.03').toString()
				)
			})
			it('totalValue was added', async () => {
				const before = await idol.totalValue()
				expect(before.toString()).to.equal('0')
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				const account = await ethers.getSigners()
				const merkleProofNext = tree.getHexProof(padBuffer(account[1].address))
				await idol
					.connect(account[1])
					.mintWhiteList(merkleProofNext, {
						value: ethers.utils.parseEther('0.03'),
					})
				const after = await idol.totalValue()
				expect(after.toString()).to.equal(
					ethers.utils.parseEther('0.06').toString()
				)
			})
			it('totalValue was added', async () => {
				const account = await ethers.getSigners()
				expect(await idol.balanceOf(account[0].address)).to.equal('0')
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				// Const account  = await ethers.getSigners()
				const merkleProofNext = tree.getHexProof(padBuffer(account[1].address))
				await idol
					.connect(account[1])
					.mintWhiteList(merkleProofNext, {
						value: ethers.utils.parseEther('0.03'),
					})
				const after = await idol.totalValue()
				expect(after.toString()).to.equal(
					ethers.utils.parseEther('0.06').toString()
				)
			})
		})
		describe('fail', () => {
			describe('send value', () => {
				it('not send value', async () => {
					await expect(idol.mintWhiteList(merkleProof)).to.be.revertedWith(
						'illegal send'
					)
				})
				it('under', async () => {
					await expect(
						idol.mintWhiteList(merkleProof, {
							value: ethers.utils.parseEther('0.02'),
						})
					).to.be.revertedWith('illegal send')
				})
				it('over', async () => {
					await expect(
						idol.mintWhiteList(merkleProof, {
							value: ethers.utils.parseEther('0.05'),
						})
					).to.be.revertedWith('illegal send')
				})
			})
			it('already claimed', async () => {
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				await expect(
					idol.mintWhiteList(merkleProof, {
						value: ethers.utils.parseEther('0.03'),
					})
				).to.be.revertedWith('already claimed')
			})
			it('invalid merkle proof', async () => {
				const account = await ethers.getSigners()
				await expect(
					idol
						.connect(account[7])
						.mintWhiteList(merkleProof, {
							value: ethers.utils.parseEther('0.03'),
						})
				).to.be.revertedWith('invalid merkle proof')
			})
			it('already claimed', async () => {
				const account = await ethers.getSigners()
				await idol.setMaxTokenCount(1)
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				const merkleProofNext = tree.getHexProof(padBuffer(account[1].address))
				await expect(
					idol
						.connect(account[1])
						.mintWhiteList(merkleProofNext, {
							value: ethers.utils.parseEther('0.03'),
						})
				).to.be.revertedWith('over maximum token number')
			})
		})
	})
})
