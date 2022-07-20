/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers, upgrades } from 'hardhat'

async function main() {
	const tokenFactory = await ethers.getContractFactory('BIdolNFT')
	const token = await upgrades.deployProxy(tokenFactory, [], { kind: 'uups' })
	await token.deployed()
	console.log('proxy was deployed to:', token.address)
	const filter = token.filters.Upgraded()
	const events = await token.queryFilter(filter)
	console.log('logic was deployed to:', events[0].args!.implementation)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
// Memo デプロイ後、price、max token count、merkleルートの設定を行うこと
// npx hardhat run dist/scripts/deploy.js --network rinkeby
// proxy was deployed to: 0x0a31115725a4a91643191bdf2aD3F1AAe3636351
// logic was deployed to: 0x71383d65426aa62c0a17617bBFC64E3Cf50F8970
// npx hardhat verify --contract contracts/BIdolNFT.sol:BIdolNFT --network rinkeby 0x71383d65426aa62c0a17617bBFC64E3Cf50F8970
