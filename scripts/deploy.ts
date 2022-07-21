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
// proxy was deployed to: 0xDf522Cb2aEdb6058E46F84B9Ab8067c90E7E60f7
// logic was deployed to: 0xAb3E5dECb1B696CFd56f661478DC032b9D232c6E
// npx hardhat verify --contract contracts/BIdolNFT.sol:BIdolNFT --network rinkeby 0xAb3E5dECb1B696CFd56f661478DC032b9D232c6E
