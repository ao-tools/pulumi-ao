import fs = require("fs")
import crypto = require("crypto")
import stream = require("stream")
import * as LuaBundle from "luabundle"

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export type ArweaveTx = {
  id: string
  owner: { address: string }
  tags: { name: string; value: string }[]
}

export const tagsObjectToArray = (tags: Record<string, string>) =>
  Object.entries(tags).map(([name, value]) => ({ name, value }))

export const tagsArrayToObject = (
  tags: { name: string; value: string }[]
): Record<string, string> =>
  tags.reduce((acc, t) => ({ ...acc, [t.name]: t.value }), {})

// Inputs that come from outputs are unknown at check time, but they all have the same string
export const isPulumiOutput = (value: string) =>
  value === "04da6b54-80e4-46f7-96ec-b56ff0331ba9"

export const isTxId = (id: string) =>
  isPulumiOutput(id) || /^[a-zA-Z0-9-_]{43}$/.test(id)

export const loadWallet = (path: string): JsonWebKey =>
  JSON.parse(fs.readFileSync(path, "utf8"))

export const loadCode = async (
  gatewayUrl: string,
  id: string
): Promise<string> =>
  await fetch(gatewayUrl.replace(/\/$/, "") + "/" + id).then((r) => r.text())

export const loadProcessTx = async (
  gatewayUrl: string,
  id: string
): Promise<ArweaveTx> => {
  const query = `
    {
      transaction(id: "${id}") {
        id
        owner {address}
        tags {name value}
      }
    }`

  return await fetch(gatewayUrl.replace(/\/$/, "") + "/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
    .then((r) => r.json())
    .then((r) => {
      if (!r.data.transaction.owner)
        throw new Error("Can't find process spawn TX on gateway:" + gatewayUrl)
      return r.data.transaction
    })
}

export const retry = async <T>(
  retries: number,
  fn: () => Promise<T>,
  timeout = 5000
): Promise<T> => {
  let error: Error
  do {
    retries--
    try {
      return await fn()
    } catch (e) {
      error = e as Error
      if (retries !== -1) await new Promise((r) => setTimeout(r, timeout))
    }
  } while (retries >= 0)
  throw error
}

export const loadLuaCode = (path: string) => fs.readFileSync(path, "utf8")

export const bundleLuaCode = (path: string) =>
  LuaBundle.bundle(path, {
    ignoredModuleNames: ["json", ".crypto", ".base64", ".pretty", ".utils"],
  })

export const hashText = (text: string) => {
  const hash = crypto.createHash("sha256")
  hash.update(text)
  return hash.digest("base64")
}

export const getSizeInBytes = (text: string) => Buffer.byteLength(text, "utf8")

export const createStream = (codeBundle: string) => {
  const codeBundleStream = new stream.Readable()
  codeBundleStream.push(codeBundle)
  codeBundleStream.push(null)
  return codeBundleStream
}
