# B-idol

## フロント開発者向け説明

フロントから実行するであろう関数のみ、説明を記述する。

### mintWhiteList

引数：bytes32[] calldata \_merkleProof

```
ホワイトリストに登録されたウォレットから一度だけ実行できる。
payableになっており、etherを送信する必要がある。
送信するetherの量はprice関数で取得できる。
発行されるNFTの数は1つだけである。
```

### mintPublic

引数：uint256 \_quantity

```
実行したアドレスに_quantityで指定しただけNFTを発行する。
ホワイトリストセールが終わった後にしか実行できない。
また、支払う必要があるetherは「価格 * _quantity」となる。
価格はprice関数で取得できる。
```

## コントラクト開発者向け説明

下記コマンドを実行し、開発環境が構築する

```bash
yarn
yarn build
```

テストは下記コマンドで実行する

```bash
yarn test
```
