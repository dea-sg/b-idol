/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers, upgrades } from 'hardhat'

async function main() {
	const idolNftAfter = await ethers.getContractFactory('BIdolNFT')
	const upgraded = await upgrades.upgradeProxy(
		'0x0a31115725a4a91643191bdf2aD3F1AAe3636351',
		idolNftAfter
	)

	const filter = upgraded.filters.Upgraded()
	const events = await upgraded.queryFilter(filter)
	console.log(
		'logic was deployed to:',
		events[events.length - 1].args!.implementation
	)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
// Npx hardhat run dist/scripts/update.js --network rinkeby
