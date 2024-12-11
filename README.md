# Pulumi-AO

This is a dynamic Pulumi resource provider for AO processes.

## Setup

### Installing Pulumi

    curl -fsSL https://get.pulumi.com | sh

### Creating a Project

Run the following command and choose the TypeScript template.

    pulumi new

### Installing the Provider

    npm i @kay-is/pulumi-ao

### Configuring the Provider

The provider requires a wallet JWK file and an optional gateway URL and scheduler ID.

> Note: Its's possible to pass these values directly to resources.

#### Required

You need to have an Arweave wallet JWK file.

    pulumi config set ao:walletPath /path/to/deployment_wallet.json

#### Optional

The gateway used to fetch code and tags from deployed processes.

    pulumi config set ao:gatewayUrl https://arweave.net

...

    pulumi config set ao:schedulerId _GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA

## Usage Examples

```typescript
import * as ao from "@kay-is/pulumi-ao"

// Simple process with Lua code
const process1 = new ao.Process("Process1", {
  // changes to the code will update the process in-place
  code: `
  local json = require("json")
  Handlers.add(
    "Info", "Info",
    function(message)
      message.reply({
        Data = json.encode({Name = Name})
      })
    end
  )
  `,
})

// Two processes with the same Lua code

const code = new ao.ProcessCode("Code", {
  // required modules are bunlded and uploaded to Arweave
  filePath: "./path/to/code.lua",
})

const process2 = new ao.Process("Process2", {
  // you can switch between code and codeId between updates
  // but only one of them can be set at a time
  codeId: code.id,
  // The TX that spawns the process can have additional tags
  // changing these tags replaces the process with a new one
  customTags: {
    key: "value",
  },
})

const process3 = new ao.Process("Process3", {
  codeId: code.id,
  // The process will have a global Environment table with these values
  // changing these values will update the process in-place
  environment: {
    key: "value",
  },
})

const process4 = new ao.Process("Process4", {
  environment: {
    process1: process1.id,
  },
  // The Environment table will be available inside the Init() function.
  // This function is called when the process whenever the Environment is created or updated.
  code: `
  local json = require("json")
  Handlers.add(
    "Info", "Info",
    function(message)
      message.reply({
        Data = json.encode({Environment = Environment})
      })
    end
  )

  function Init()
    Send({Targte = Environment.process1, Action = "Info"})
  end
  `,
})

const process5 = new ao.Process("Process5", {
  // Scheduler, module, and authority, but these are optional
  // testnet scheduler
  schedulerId: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
  // AOS 2.0.1
  moduleId: "Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM",
  // testnet authority
  authorityId: "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY",
  gatewayUrl: "https://arweave.net",
  walletPath: "/path/to/process_5_wallet.json",
  codeId: code.id,
})

// Pulumi resource IDs are Arweave TX IDs
export const processId = process1.id
export const processName = process1.name
export const processTags = process1.tags
export const processCustomTags = process1.customTags
export const processEnvironment = process1.environment
export const processCode = process1.code
export const processCodeId = process2.codeId
export const processSchedulerId = process.schedulerId
export const processModuleId = process.moduleId
export const processAuthorityId = process.authorityId
```
