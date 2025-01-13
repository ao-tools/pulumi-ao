import * as Pulumi from "@pulumi/pulumi"
import * as TurboSdk from "@ardrive/turbo-sdk"
import type { JWKInterface } from "@ardrive/turbo-sdk/lib/types/common/jwk"
import * as Utils from "../utilities"

export interface ProcessCodeProviderInputs {
  name: string
  owner: string | null
  filePath: string
  walletPath: string
  bundleLuaCode: boolean
  sha256: string | null
}
/**
 * This dynamic resource provider uploads Lua files to Arweave
 * It uses luabundle to bundle all code into one file.
 * It uses turbo-sdk to upload the file to Arweave.
 */
export class ProcessCodeProvider implements Pulumi.dynamic.ResourceProvider {
  async create(
    inputs: ProcessCodeProviderInputs
  ): Promise<Pulumi.dynamic.CreateResult> {
    const turboClient = TurboSdk.TurboFactory.authenticated({
      privateKey: Utils.loadWallet(inputs.walletPath) as JWKInterface,
    })

    const codeBundle = inputs.bundleLuaCode
      ? Utils.bundleLuaCode(inputs.filePath)
      : Utils.loadLuaCode(inputs.filePath)

    const digest = Utils.hashText(codeBundle)

    const result = await turboClient.uploadFile({
      fileSizeFactory: () => Utils.getSizeInBytes(codeBundle),
      fileStreamFactory: () => Utils.createStream(codeBundle),
      dataItemOpts: {
        tags: [
          { name: "Name", value: inputs.name },
          { name: "Sha256", value: digest },
        ],
      },
    })

    return {
      id: result.id,
      outs: {
        name: inputs.name,
        owner: result.owner,
        filePath: inputs.filePath,
        sha256: digest,
      },
    }
  }

  /**
   * Uses compares hashes of the code bundles to check for changes.
   * Called on every update.
   */
  async diff(
    _id: string,
    olds: ProcessCodeProviderInputs,
    news: ProcessCodeProviderInputs
  ): Promise<Pulumi.dynamic.DiffResult> {
    const diffResult: { changes: boolean; replaces?: string[] } = {
      changes: false,
    }

    const replaces: string[] = []
    if (olds.name !== news.name) replaces.push("name")
    if (olds.filePath !== news.filePath) replaces.push("filePath")

    const codeBundle = news.bundleLuaCode
      ? Utils.bundleLuaCode(news.filePath)
      : Utils.loadLuaCode(news.filePath)

    const newSha256 = Utils.hashText(codeBundle)

    if (newSha256 !== olds.sha256) replaces.push("sha256")

    if (replaces.length > 0) {
      diffResult.changes = true
      diffResult.replaces = replaces
    }

    return diffResult
  }
}
