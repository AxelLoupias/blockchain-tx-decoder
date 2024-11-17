import {
  type Provider,
  type TransactionReceipt,
  type TransactionResponse,
  type CallExceptionError,
  type Result,
  type Interface,
  ethers,
  hexlify,
} from 'ethers'
import {
  InvalidTxHash,
  ContractNotFound,
  ConstructorTransaction,
} from './errors'
import type {
  TxData,
  TransactionData,
  ContractData,
  RevertData,
  InputConstructor,
  ContractInformation,
  DecodedTransaction,
} from './types'

export class TransactionDecoder {
  provider: Provider
  contractInfo!: ContractInformation[]

  constructor({ provider, contractInfo }: InputConstructor) {
    this.provider = provider
    this.contractInfo = contractInfo
  }

  async getTxData(txHash: string): Promise<TxData> {
    const receipt = await this.provider.getTransactionReceipt(txHash)
    if (!receipt) {
      throw new InvalidTxHash(txHash)
    }
    const transaction = await receipt.getTransaction()
    // if (!transaction.to) {
    //   throw new ConstructorTransaction()
    // }
    const transactionData = await this.getTransactionData(receipt, transaction)
    const { decodedTransaction, contractInterface } =
      await this.getTransactionDescription(transaction)
    const contractData = await this.getContractData(
      receipt,
      decodedTransaction,
      contractInterface,
    )
    const revertData = await this.getRevertData(
      receipt,
      transaction,
      contractInterface,
    )
    return {
      transactionData,
      contractData,
      revertData,
    }
  }

  private async getTransactionData(
    receipt: TransactionReceipt,
    transaction: TransactionResponse,
  ): Promise<TransactionData> {
    return {
      from: receipt.from,
      to: receipt.to,
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      isConstructorTransaction: receipt.to ? false : true,
      blockTimestamp: (await receipt.getBlock()).timestamp,
      txValue: `${ethers.formatEther(transaction.value)} ETH`,
      txGasPrice: `${ethers.formatUnits(receipt.gasPrice, 'gwei')} Gwei`,
      txGasUsed: `${ethers.formatEther(
        receipt.gasPrice * receipt.gasUsed,
      )} ETH`,
    }
  }

  private async getTransactionDescription(
    transaction: TransactionResponse,
  ): Promise<{
    decodedTransaction: DecodedTransaction
    contractInterface: Interface
  }> {
    for (let contractInfo of this.contractInfo) {
      const tempInterface = new ethers.Interface(contractInfo.abi)
      const transactionParsed = tempInterface.parseTransaction({
        data: transaction.data,
      })

      if (transactionParsed != null) {
        return {
          decodedTransaction: {
            args: transactionParsed.args,
            name: transactionParsed.name,
            selector: transactionParsed.selector,
          },
          contractInterface: tempInterface,
        }
      }

      if (!transaction.to && contractInfo.bytecode) {
        const decodedParams = tempInterface._decodeParams(
          tempInterface.deploy.inputs,
          `0x${transaction.data.slice(contractInfo.bytecode.length)}`,
        )

        return {
          decodedTransaction: {
            args: decodedParams,
            name: '',
            selector: '',
          },
          contractInterface: tempInterface,
        }
      }
    }
    if (transaction.to) {
      throw new ContractNotFound(hexlify(transaction.data.slice(0, 8)))
    } else {
      throw new ConstructorTransaction()
    }
  }

  private async getContractData(
    receipt: TransactionReceipt,
    transactionDescription: any,
    contractInterface: Interface,
  ): Promise<ContractData> {
    return {
      name: transactionDescription.name,
      selector: transactionDescription.selector,
      args: this.resultToObject(transactionDescription.args),
      events: receipt.logs
        .map((log) => {
          return contractInterface.parseLog({
            data: log.data,
            topics: log.topics,
          })
        })
        .map((event) => {
          return {
            name: event!.name,
            args: this.resultToObject(event!.args),
          }
        }),
    }
  }

  private async getRevertData(
    receipt: TransactionReceipt,
    transaction: TransactionResponse,
    contractInterface: Interface,
  ): Promise<RevertData | undefined> {
    if (receipt.status === 1) {
      return undefined
    }
    const errorDescription = await this.getErrorDescription(
      transaction,
      contractInterface,
    )
    return {
      name: errorDescription.name,
      selector: errorDescription?.selector,
      args: this.resultToObject(errorDescription.args),
    }
  }

  private async getErrorDescription(
    transaction: TransactionResponse,
    contractInterface: Interface,
  ) {
    let revertError
    const txRequest = {
      to: transaction.to,
      from: transaction.from,
      data: transaction.data,
      value: transaction.value,
      gasPrice: transaction.gasPrice,
      gasLimit: transaction.gasLimit,
    }
    try {
      await this.provider.call(txRequest)
    } catch (error: any) {
      const callExceptionError = error as CallExceptionError
      revertError = callExceptionError.data
    }
    return contractInterface.parseError(revertError!)!
  }

  private resultToObject(input: Result): { [key: string]: unknown }[] {
    if (typeof input !== 'object' || input === null) {
      return input
    }

    let entries
    try {
      entries = Object.entries(input.toObject())
    } catch (error) {
      entries = Object.entries(input.toArray())
    }

    return entries.map(([key, value]) => ({
      key: key.toString(),
      value: this.resultToObject(value),
    }))
  }

  static stringify(obj: any) {
    if (['string', 'number'].includes(typeof obj)) {
      return obj
    }
    return JSON.stringify(
      obj,
      (_, value) => (typeof value === 'bigint' ? value.toString() : value),
      2,
    )
  }
}
