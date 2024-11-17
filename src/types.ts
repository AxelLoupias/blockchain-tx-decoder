import { Provider, Result } from 'ethers'

export type ContractInformation = {
  abi: any[]
  bytecode?: string
}

export type InputConstructor = {
  provider: Provider
  contractInfo: ContractInformation[]
}

export type TransactionData = {
  from: string
  to: string | null
  status: number | null
  blockNumber: number
  blockTimestamp: number
  isConstructorTransaction: boolean
  txValue: string
  txGasPrice: string
  txGasUsed: string
}

export type ContractData = {
  name: string
  selector: string
  args: { [key: string]: unknown }[]
  events: {
    name: string
    args: {
      [key: string]: unknown
    }[]
  }[]
}

export type RevertData = {
  name: string
  selector: string
  args: { [key: string]: unknown }[]
}

export type TxData = {
  transactionData: TransactionData
  contractData: ContractData
  revertData?: RevertData
}

export type DecodedTransaction = {
  args: Result
  name: string
  selector: string
}
