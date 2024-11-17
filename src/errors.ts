export class InvalidTxHash extends Error {
  constructor(txHash: string) {
    super(`txHash not found ${txHash}`)
  }
}

export class WalletNoDetected extends Error {
  constructor() {
    super(`Wallet no detected`)
  }
}

export class ContractNotFound extends Error {
  constructor(selector: string) {
    super(`Not found a contract with selector:${selector}`)
  }
}

export class ConstructorTransaction extends Error {
  constructor() {
    super(
      `Can't retrieve information about a ConstructorTransaction without bytecode`,
    )
  }
}
