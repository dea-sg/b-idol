import { ethers } from 'hardhat'
import { MerkleTree } from 'merkletreejs'

const padBuffer = (addr: string) =>
	Buffer.from(addr.substr(2).padStart(32 * 2, '0'), 'hex')
async function main() {
	const whitelisted = ['']
	const leaves = whitelisted.map((address) => padBuffer(address))
	const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sort: true })
	const merkleRoot = tree.getHexRoot()
	console.log(merkleRoot)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
