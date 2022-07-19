// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/draft-IERC1822Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "./azuki/ERC721AUpgradeable.sol";
import "./interfaces/IBIdolNFT.sol";

contract BIdolNFT is
	OwnableUpgradeable,
	UUPSUpgradeable,
	ERC721AUpgradeable,
	ERC2981Upgradeable,
	IBIdolNFT
{
	using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
	using MerkleProofUpgradeable for bytes32[];
	uint256 public price = 30000000000000000; // 0.03ether
	uint256 public maxTokenCount = 5000;
	uint256 public totalValue;
	bytes32 public merkleRoot;
	mapping(address => bool) public claimed;
	EnumerableSetUpgradeable.AddressSet private owners;

	function initialize() public initializer {
		__Ownable_init();
		__UUPSUpgradeable_init();
		__ERC721A_init("B-idol", "P-BIDOL");
		__ERC2981_init();
	}

	function supportsInterface(bytes4 _interfaceId)
		public
		view
		virtual
		override(ERC2981Upgradeable, ERC721AUpgradeable)
		returns (bool)
	{
		return
			_interfaceId == type(IBIdolNFT).interfaceId ||
			_interfaceId == type(IERC1822ProxiableUpgradeable).interfaceId ||
			ERC2981Upgradeable.supportsInterface(_interfaceId) ||
			ERC721AUpgradeable.supportsInterface(_interfaceId);
	}

	function tokenURI(uint256 tokenId)
		public
		view
		virtual
		override
		returns (string memory)
	{
		if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

		// string memory baseURI = _baseURI();
		// return
		// 	bytes(baseURI).length != 0
		// 		? string(abi.encodePacked(baseURI, _toString(tokenId)))
		// 		: "";
				string memory name = string(
			abi.encodePacked(
				"Project B-idol"
			)
		);
		string memory description = string(
			abi.encodePacked(
				// solhint-disable-next-line quotes
				'Your support will create their future! \x20\x1CProject B-idol\x20\x1D, a new generation of Web3 digital idols by blockchain technology \x20\x1CProject B-idol\x20\x1D is a digital idol project being developed as NFT. The girls, who aim to become miraculous \x20\x1CSuper Idols\x20\x1D, will be active in the blockchain world!'
			)
		);
		string memory image = string(
				abi.encodePacked(
					"https://hogehoge/",
					tokenId,
					".jpg"
				)
			);
		return
			string(
				abi.encodePacked(
							// solhint-disable-next-line quotes
							'{"name":"',
							name,
							// solhint-disable-next-line quotes
							'", "description":"',
							description,
							// solhint-disable-next-line quotes
							'", "image": "',
							image,
							// solhint-disable-next-line quotes
							'"}'
				)
			);
	}

	function mintWhiteList(bytes32[] calldata _merkleProof) external payable {
		require(price == msg.value, "illegal send");
		require(claimed[msg.sender] == false, "already claimed");
		claimed[msg.sender] = true;
		require(
			_merkleProof.verify(merkleRoot, toBytes32(msg.sender)) == true,
			"invalid merkle proof"
		);
		totalValue += msg.value;
		_mint(msg.sender, 1);
		checkMaxTokenId();
	}

	function toBytes32(address _addr) private pure returns (bytes32) {
		return bytes32(uint256(uint160(_addr)));
	}

	function mintByOwner(address _target, uint256 _quantity)
		external
		onlyOwner
	{
		_mint(_target, _quantity);
		checkMaxTokenId();
	}

	function mintPublic(uint256 _quantity) external payable {
		uint256 price_ = price * _quantity;
		require(price_ == msg.value, "illegal send");
		totalValue += msg.value;
		_mint(msg.sender, _quantity);
		checkMaxTokenId();
	}

	function withdraw() external onlyOwner {
		uint256 tmp = totalValue;
		totalValue = 0;
		payable(msg.sender).transfer(tmp);
	}

	function checkMaxTokenId() private view {
		require(maxTokenCount > _totalMinted(), "over maximum token number ");
	}

	function setMaxTokenCount(uint256 _maxTokenCount) external onlyOwner {
		maxTokenCount = _maxTokenCount;
	}

	function setPrice(uint256 _price) external onlyOwner {
		price = _price;
	}

	function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
		merkleRoot = _merkleRoot;
	}

	function _afterTokenTransfers(
		address _from,
		address _to,
		uint256,
		uint256
	) internal virtual override {
		if (_from == address(0)) {
			// mint
			owners.add(_to);
		} else if (_to == address(0)) {
			// burn
			uint256 balance = balanceOf(_from);
			if (balance == 0) {
				owners.remove(_from);
			}
		} else {
			// transfer
			uint256 balance = balanceOf(_from);
			if (balance == 0) {
				owners.remove(_from);
			}
			owners.add(_to);
		}
	}

	function burn(uint256 _tokenId) external {
		_burn(_tokenId, true);
	}

	function getOwners() external view returns (address[] memory) {
		return owners.values();
	}

	function _authorizeUpgrade(address) internal override onlyOwner {}
}
	// 残 TODO
	// 二時流通ロイヤリティのロジックを組み込む
	// token uriの形式を確認する
	// 単体テスト
	// interfaceにコメント書く
	// フロント担当者のために使い方まとめる(readme)
	// openseaのテストネットで実験する