import * as Pulumi from "@pulumi/pulumi"
import { ProcessCodeProvider } from "./provider"

export interface ProcessCodeInputProps {
  name?: Pulumi.Input<string>
  walletPath?: Pulumi.Input<string>
  bundleLuaCode?: Pulumi.Input<boolean>
  filePath: Pulumi.Input<string>
}

/**
 * Represents a Lua code upload to Arweave.
 * Will bundle Lua code before uploading.
 * Uses the Turbo SDK for uploads.
 * The id is the Arweave TX ID and can be passed to Process resources.
 */
export class ProcessCode extends Pulumi.dynamic.Resource {
  public readonly name!: Pulumi.Output<string>
  public readonly walletPath!: Pulumi.Output<string>
  public readonly owner!: Pulumi.Output<string>
  public readonly filePath!: Pulumi.Output<string>
  public readonly bundleLuaCode!: Pulumi.Output<boolean>

  constructor(
    name: string,
    inputProps: ProcessCodeInputProps,
    opts?: Pulumi.CustomResourceOptions
  ) {
    inputProps.name = inputProps.name ?? name

    const config = new Pulumi.Config("ao")
    inputProps.walletPath =
      inputProps.walletPath ?? config.require("walletPath")

    inputProps.bundleLuaCode = !!inputProps.bundleLuaCode

    // These props can't directly be set by the user
    const outputProps = { owner: null, sha256: null }

    const allProps = { ...inputProps, ...outputProps }

    super(new ProcessCodeProvider(), name, allProps, opts, "ao", "ProcessCode")
  }
}
