import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Wallet } from 'ethers'
import {
	takeSnapshot,
	SnapshotRestorer,
} from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BIdolNFT, SupportInterfaceTest } from '../typechain-types'
import { MerkleTree } from 'merkletreejs'

describe('BIdolNFT', () => {
	let idol: BIdolNFT
	let snapshot: SnapshotRestorer
	const padBuffer = (addr: string) =>
		Buffer.from(addr.substr(2).padStart(32 * 2, '0'), 'hex')

	const getMerkleTree = async (
		whitelisted: SignerWithAddress[]
	): Promise<MerkleTree> => {
		const leaves = whitelisted.map((account) => padBuffer(account.address))
		const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true })
		return tree
	}

	const getWhiteListed = async (): Promise<SignerWithAddress[]> => {
		const accounts = await ethers.getSigners()
		const whitelisted = accounts.slice(0, 5)
		return whitelisted
	}

	const getMerkleProof = async (
		whitelisted: SignerWithAddress[],
		tree: MerkleTree,
		index: number
	): Promise<string[]> => {
		const merkleProof = tree.getHexProof(padBuffer(whitelisted[index].address))
		return merkleProof
	}

	before(async () => {
		const factory = await ethers.getContractFactory('BIdolNFT')
		idol = (await factory.deploy()) as BIdolNFT
		await idol.deployed()
		await idol.initialize()
	})
	before(async () => {
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
		beforeEach(async () => {
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
		beforeEach(async () => {
			const tmp = Wallet.createRandom()
			await idol.mintByOwner(tmp.address, 3)
		})
		describe('success', () => {
			it('name', async () => {
				const uri = await idol.tokenURI(1)
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
		let whitelisted: SignerWithAddress[]
		beforeEach(async () => {
			whitelisted = await getWhiteListed()
			tree = await getMerkleTree(whitelisted)
			const merkleRoot = tree.getHexRoot()
			await idol.setMerkleRoot(merkleRoot)
			merkleProof = await getMerkleProof(whitelisted, tree, 0)
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
			it('total value was set', async () => {
				const account = await ethers.getSigners()
				const price = ethers.utils.parseEther('0.03')
				await expect(
					idol.mintWhiteList(merkleProof, {
						value: price,
					})
				).to.changeEtherBalances(
					[account[0].address, idol.address],
					[price.mul(-1), price]
				)
			})
			it('minted', async () => {
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				const account = await ethers.getSigners()
				const merkleProofNext = await getMerkleProof(whitelisted, tree, 1)
				await idol.connect(account[1]).mintWhiteList(merkleProofNext, {
					value: ethers.utils.parseEther('0.03'),
				})
				expect(await idol.balanceOf(account[0].address)).to.equal(1)
				expect(await idol.balanceOf(account[1].address)).to.equal(1)
				expect(await idol.totalSupply()).to.equal(2)
				expect(await idol.ownerOf(0)).to.equal(account[0].address)
				expect(await idol.ownerOf(1)).to.equal(account[1].address)
			})
			it('price change', async () => {
				await idol.setPrice(ethers.utils.parseEther('0.05'))
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.05'),
				})
				const account = await ethers.getSigners()
				expect(await idol.balanceOf(account[0].address)).to.equal(1)
				expect(await idol.ownerOf(0)).to.equal(account[0].address)
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
					idol.connect(account[7]).mintWhiteList(merkleProof, {
						value: ethers.utils.parseEther('0.03'),
					})
				).to.be.revertedWith('invalid merkle proof')
			})
			it('over tokrn count', async () => {
				const account = await ethers.getSigners()
				await idol.setMaxTokenCount(1)
				await idol.mintWhiteList(merkleProof, {
					value: ethers.utils.parseEther('0.03'),
				})
				const merkleProofNext = await getMerkleProof(whitelisted, tree, 1)
				await expect(
					idol.connect(account[1]).mintWhiteList(merkleProofNext, {
						value: ethers.utils.parseEther('0.03'),
					})
				).to.be.revertedWith('over maximum token number')
			})
		})
	})

	describe('mintByOwner', () => {
		describe('success', () => {
			it('claime', async () => {
				const user = Wallet.createRandom()
				await idol.mintByOwner(user.address, 100)
				expect(await idol.balanceOf(user.address)).to.equal(100)
				expect(await idol.totalSupply()).to.equal(100)
			})
		})
		describe('fail', () => {
			it('only owner', async () => {
				const user = Wallet.createRandom()
				const account = await ethers.getSigners()
				await expect(
					idol.connect(account[1]).mintByOwner(user.address, 100)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
			it('over token max count', async () => {
				const user = Wallet.createRandom()
				await idol.setMaxTokenCount(1)
				await expect(idol.mintByOwner(user.address, 2)).to.be.revertedWith(
					'over maximum token number'
				)
			})
		})
	})
	describe('mintPublic', () => {
		describe('success', () => {
			it('claime', async () => {
				const account = await ethers.getSigners()
				await idol.setIsPublicSale(true)
				await idol.mintPublic(100, {
					value: ethers.utils.parseEther('3'),
				})
				expect(await idol.balanceOf(account[0].address)).to.equal(100)
				expect(await idol.totalSupply()).to.equal(100)
			})
			it('claime(change price)', async () => {
				const account = await ethers.getSigners()
				await idol.setIsPublicSale(true)
				await idol.setPrice(ethers.utils.parseEther('0.02'))
				await idol.mintPublic(100, {
					value: ethers.utils.parseEther('2'),
				})
				expect(await idol.balanceOf(account[0].address)).to.equal(100)
				expect(await idol.totalSupply()).to.equal(100)
			})
		})
		describe('fail', () => {
			it('not public sale', async () => {
				await expect(
					idol.mintPublic(100, {
						value: ethers.utils.parseEther('3'),
					})
				).to.be.revertedWith('not public sale')
			})
			it('not send value', async () => {
				await idol.setIsPublicSale(true)
				await expect(
					idol.mintPublic(100, {
						value: ethers.utils.parseEther('2'),
					})
				).to.be.revertedWith('illegal send')
			})
			it('over token max count', async () => {
				await idol.setMaxTokenCount(1)
				await idol.setIsPublicSale(true)
				await expect(
					idol.mintPublic(100, {
						value: ethers.utils.parseEther('3'),
					})
				).to.be.revertedWith('over maximum token number')
			})
		})
	})
	describe('withdraw', () => {
		describe('success', () => {
			it('withdraw all ether', async () => {
				const user = Wallet.createRandom()
				const pliceAll = ethers.utils.parseEther('3')
				await idol.setIsPublicSale(true)
				await idol.mintPublic(100, {
					value: pliceAll,
				})
				await expect(idol.withdraw(user.address)).to.changeEtherBalances(
					[idol.address, user.address],
					[pliceAll.mul(-1), pliceAll]
				)
			})
		})
		describe('fail', () => {
			it('only owner', async () => {
				const user = Wallet.createRandom()
				const account = await ethers.getSigners()
				await expect(
					idol.connect(account[1]).withdraw(user.address)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})

	describe('setMaxTokenCount', () => {
		describe('success', () => {
			it('set max token count', async () => {
				expect(await idol.maxTokenCount()).to.equal(5000)
				await idol.setMaxTokenCount(100)
				expect(await idol.maxTokenCount()).to.equal(100)
			})
		})
		describe('fail', () => {
			it('only owner', async () => {
				const account = await ethers.getSigners()
				await expect(
					idol.connect(account[1]).setMaxTokenCount(100)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})

	describe('setPrice', () => {
		describe('success', () => {
			it('set price', async () => {
				expect(await idol.price()).to.equal('30000000000000000')
				await idol.setPrice('4000000000000000')
				expect(await idol.price()).to.equal('4000000000000000')
			})
		})
		describe('fail', () => {
			it('only owner', async () => {
				const account = await ethers.getSigners()
				await expect(idol.connect(account[1]).setPrice(100)).to.be.revertedWith(
					'Ownable: caller is not the owner'
				)
			})
		})
	})

	describe('setMerkleRoot', () => {
		const newValue =
			'0x0100000000000000000000000000000000000000000000000000000000000000'
		describe('success', () => {
			it('set price', async () => {
				expect(await idol.merkleRoot()).to.equal(ethers.constants.HashZero)
				await idol.setMerkleRoot(newValue)
				expect(await idol.merkleRoot()).to.equal(newValue)
			})
		})
		describe('fail', () => {
			it('only owner', async () => {
				const account = await ethers.getSigners()
				await expect(
					idol.connect(account[1]).setMerkleRoot(newValue)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})

	describe('setIsPublicSale', () => {
		describe('success', () => {
			it('set price', async () => {
				expect(await idol.isPublicSale()).to.equal(false)
				await idol.setIsPublicSale(true)
				expect(await idol.isPublicSale()).to.equal(true)
			})
		})
		describe('fail', () => {
			it('only owner', async () => {
				const account = await ethers.getSigners()
				await expect(
					idol.connect(account[1]).setIsPublicSale(true)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})

	describe('getOwners', () => {
		it('not mint', async () => {
			const owners = await idol.getOwners()
			expect(owners).to.deep.equal([])
		})
		it('many mint', async () => {
			const user = Wallet.createRandom()
			await idol.mintByOwner(user.address, 100)
			const owners = await idol.getOwners()
			expect(owners).to.deep.equal([user.address])
		})
		it('many mint and transfer', async () => {
			const account = await ethers.getSigners()
			const user = Wallet.createRandom()
			await idol.mintByOwner(account[7].address, 100)
			await idol
				.connect(account[7])
				.transferFrom(account[7].address, user.address, 3)
			const owners = await idol.getOwners()
			expect(owners).to.deep.equal([account[7].address, user.address])
		})
		it('many mint and transfer2', async () => {
			const account = await ethers.getSigners()
			await idol.mintByOwner(account[6].address, 100)
			await idol.mintByOwner(account[7].address, 2)
			await idol.mintByOwner(account[8].address, 1)
			await idol.mintByOwner(account[9].address, 4)
			await idol
				.connect(account[8])
				.transferFrom(account[8].address, account[5].address, 102)
			const owners = await idol.getOwners()
			expect(owners).to.deep.equal([
				account[6].address,
				account[7].address,
				account[9].address,
				account[5].address,
			])
		})
		it('many mint and transfer3', async () => {
			const account = await ethers.getSigners()
			await idol.mintByOwner(account[6].address, 100)
			await idol.mintByOwner(account[7].address, 2)
			await idol.mintByOwner(account[8].address, 1)
			await idol.mintByOwner(account[9].address, 4)
			await idol
				.connect(account[7])
				.transferFrom(account[7].address, account[8].address, 101)
			const owners = await idol.getOwners()
			expect(owners).to.deep.equal([
				account[6].address,
				account[7].address,
				account[8].address,
				account[9].address,
			])
		})
		it('many mint and burn', async () => {
			const account = await ethers.getSigners()
			await idol.mintByOwner(account[6].address, 100)
			await idol.mintByOwner(account[7].address, 2)
			await idol.mintByOwner(account[8].address, 1)
			await idol.mintByOwner(account[9].address, 4)
			await idol.connect(account[8]).burn(102)
			const owners = await idol.getOwners()
			expect(owners).to.deep.equal([
				account[6].address,
				account[7].address,
				account[9].address,
			])
		})
	})

	describe('burn', () => {
		describe('success', () => {
			it('burn', async () => {
				const account = await ethers.getSigners()
				await idol.mintByOwner(account[6].address, 3)
				await idol.connect(account[6]).burn(1)
				expect(await idol.totalSupply()).to.equal(2)
				expect(await idol.balanceOf(account[6].address)).to.equal(2)
			})
		})
		describe('fail', () => {
			it('only owner', async () => {
				const account = await ethers.getSigners()
				await idol.mintByOwner(account[6].address, 3)
				await expect(idol.burn(1)).to.be.revertedWithCustomError(
					idol,
					'TransferCallerNotOwnerNorApproved'
				)
			})
		})
	})
})
