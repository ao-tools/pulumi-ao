import * as Pulumi from "@pulumi/pulumi"
import * as AoConnect from "@permaweb/aoconnect"
import type { SpawnProcessArgs } from "@permaweb/aoconnect/dist/lib/spawn"
import * as Utils from "../utilities"

export interface ProcessProviderInputs {
  name: string
  owner: string
  code: string | undefined
  codeId: string | undefined
  moduleId: string
  schedulerId: string
  authorityId: string
  tags: Record<string, string>
  customTags: Record<string, string>
  environment: Record<string, string>
  walletPath: string
  gatewayUrl: string
}

/**
 * Uses aoconnect to manage AO processes
 */
export class ProcessProvider implements Pulumi.dynamic.ResourceProvider {
  /**
   * Checks that Resource inputs are valid
   * Runs every time
   */
  async check(
    _olds: ProcessProviderInputs,
    news: ProcessProviderInputs
  ): Promise<Pulumi.dynamic.CheckResult> {
    const failures: Pulumi.dynamic.CheckFailure[] = []

    if (news.code && news.codeId) {
      failures.push({
        property: "codeId",
        reason: "Only one of 'code' or 'codeId' can be set",
      })
      failures.push({
        property: "code",
        reason: "Only one of 'code' or 'codeId' can be set",
      })
    }

    if (!news.code && !news.codeId) {
      failures.push({
        property: "codeId",
        reason: "One of 'code' or 'codeId' must be set",
      })
      failures.push({
        property: "code",
        reason: "One of 'code' or 'codeId' must be set",
      })
    }

    if (news.codeId && !Utils.isTxId(news.codeId))
      failures.push({
        property: "codeId",
        reason: "ID invalid: " + news.codeId,
      })

    if (!Utils.isTxId(news.moduleId))
      failures.push({
        property: "moduleId",
        reason: "ID invalid: " + news.moduleId,
      })

    if (!Utils.isTxId(news.schedulerId))
      failures.push({
        property: "schedulerId",
        reason: "ID invalid: " + news.schedulerId,
      })

    if (!Utils.isTxId(news.authorityId))
      failures.push({
        property: "authorityId",
        reason: "ID invalid: " + news.authorityId,
      })

    return { failures }
  }

  /**
   * Loads the current state of a process from AO
   * Called by pulumi refresh
   */
  async read(id: string, props?: any): Promise<Pulumi.dynamic.ReadResult> {
    const processTx = await Utils.loadProcessTx(props.gatewayUrl, id)

    const readProps: Partial<ProcessProviderInputs> = {}

    readProps.name = processTx.tags.find((t) => t.name === "Name")?.value ?? ""

    readProps.codeId =
      processTx.tags.find((t) => t.name === "On-Boot")?.value ?? ""

    readProps.moduleId =
      processTx.tags.find((t) => t.name === "Module")?.value ?? ""

    readProps.schedulerId =
      processTx.tags.find((t) => t.name === "Scheduler")?.value ?? ""

    readProps.authorityId =
      processTx.tags.find((t) => t.name === "Authority")?.value ?? ""

    readProps.tags = Utils.tagsArrayToObject(processTx.tags)

    return { id, props: readProps }
  }

  /**
   * Checks if a process needs to be updated or replaced
   * Called after check()
   */
  async diff(
    _id: string,
    olds: ProcessProviderInputs,
    news: ProcessProviderInputs
  ): Promise<Pulumi.dynamic.DiffResult> {
    let diffResult: Utils.Mutable<Pulumi.dynamic.DiffResult> = {
      changes: false,
    }

    // changes that require to create a new process
    const replaces: string[] = []
    if (olds.name !== news.name) replaces.push("name")
    if (olds.moduleId !== news.moduleId) replaces.push("moduleId")
    if (olds.schedulerId !== news.schedulerId) replaces.push("schedulerId")
    if (olds.authorityId !== news.authorityId) replaces.push("authorityId")

    let tagsChanged = false
    for (let [name, value] of Object.entries(news.customTags)) {
      if (!olds.customTags[name] || olds.customTags[name] !== value) {
        replaces.push("customTags")
        tagsChanged = true
        break
      }
    }

    if (!tagsChanged) {
      for (let [name, value] of Object.entries(olds.customTags)) {
        if (!news.customTags[name] || news.customTags[name] !== value) {
          replaces.push("customTags")
          break
        }
      }
    }

    if (replaces.length > 0) diffResult.replaces = replaces

    // changes that can be done via update
    const updates =
      olds.codeId !== news.codeId ||
      olds.code !== news.code ||
      JSON.stringify(olds.environment) !== JSON.stringify(news.environment)

    diffResult.changes = diffResult.replaces !== undefined || updates

    return diffResult
  }

  /**
   * Spawns a new AO process, and sets the environment variables after creation.
   * Called after diff() when a new process is created or needs to be replaced.
   */
  async create(
    inputs: ProcessProviderInputs
  ): Promise<Pulumi.dynamic.CreateResult> {
    const jwkWallet = Utils.loadWallet(inputs.walletPath)

    const spawnTags = [
      { name: "Name", value: inputs.name },
      { name: "On-Boot", value: inputs.codeId ?? "Data" },
      { name: "Authority", value: inputs.authorityId },
    ]
    const customTags = Utils.tagsObjectToArray(inputs.customTags)
    const allTags = [...customTags, ...spawnTags]

    const spawnOptions: SpawnProcessArgs = {
      module: inputs.moduleId,
      scheduler: inputs.schedulerId,
      signer: AoConnect.createDataItemSigner(jwkWallet),
      tags: allTags,
    }

    if (inputs.code) spawnOptions.data = inputs.code

    let processId = await AoConnect.spawn(spawnOptions)

    const envTable = Object.entries(inputs.environment)
      .map(([name, value]) => `["${name}"]="${value}"`)
      .join(", ")
    const setEnvironmentCode = `
      Environment = { ${envTable} }
      if type(Init) == "function" then Init() end
      `

    await Utils.retry(5, () =>
      AoConnect.message({
        process: processId,
        signer: AoConnect.createDataItemSigner(jwkWallet),
        tags: [{ name: "Action", value: "Eval" }],
        data: setEnvironmentCode,
      })
    )

    const processTx = await Utils.retry(5, () =>
      Utils.loadProcessTx(inputs.gatewayUrl, processId)
    )

    const outputs = {
      owner: processTx.owner.address,
      tags: Utils.tagsArrayToObject(processTx.tags),
    }

    return {
      id: processId,
      outs: { ...inputs, ...outputs },
    }
  }

  /**
   * Sends messages to the AO process to update the environment variables and code.
   * Called after diff() when a process needs to be updated.
   */
  async update(
    id: string,
    olds: ProcessProviderInputs,
    news: ProcessProviderInputs
  ): Promise<Pulumi.dynamic.UpdateResult> {
    let codeUpdate = ""

    if (JSON.stringify(news.environment) !== JSON.stringify(olds.environment)) {
      const envTable = Object.entries(news.environment)
        .map(([name, value]) => `["${name}"]="${value}"`)
        .join(", ")
      codeUpdate = `Environment = { ${envTable} }
      ` // newline for additional code
    }

    let codeChanged = false
    if (news.code && !news.codeId && news.code !== olds.code) {
      codeUpdate += news.code
      codeChanged = true
    }
    if (news.codeId && !news.code && news.codeId !== olds.codeId) {
      codeUpdate += await Utils.loadCode(news.gatewayUrl, news.codeId)
      codeChanged = true
    }

    // Only call Init if code actually changed
    if (codeChanged)
      codeUpdate += `
if type(Init) == "function" then Init() end`

    const jwkWallet = Utils.loadWallet(news.walletPath)

    const messageId = await AoConnect.message({
      process: id,
      signer: AoConnect.createDataItemSigner(jwkWallet),
      tags: [{ name: "Action", value: "Eval" }],
      data: codeUpdate,
    })
    const result = await AoConnect.result({ process: id, message: messageId })

    if (result.Error) throw new Error(result.Error)

    return { outs: { ...news, tags: olds.tags, owner: olds.owner } }
  }
}
