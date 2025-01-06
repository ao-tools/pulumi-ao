# Pulumi-AO

This is a dynamic Pulumi resource provider for AO processes. It allows you to
deploy and manage AO processes and their Lua code using Pulumi.

## Features

This provider offers the following features:

### Seamless integration with existing Pulumi stacks

This provider enables Pulumi to manage AO process, allowing you to integrate
them with other cloud resources and services supported by Pulumi.

### Lua code bundling and upoads to Arweave

The provider can bundle Lua code with
[luabundle](https://github.com/Benjamin-Dobell/luabundle), just enter the path
to your entry file and the provider will take care of the rest. The bundled code
is then permanently uploaded to Arweave with
[ArDrive Turbo](https://ardrive.io/turbo-bundler/).

### Direct code injection and code sharing

You can either provide the Lua code directly when defining a `Process` resource
to quickly write a simple process or use a `ProcessCode` resource to share code
between multiple processes.

### In-place code updates

Update code or switch from direct code injection to code sharing without
replacing the process.

### Environment variables

Define a process with environment variables that are available to the Lua code
in a global `Environment` table. Changing these variables will update the
process in-place.

## Setup

### Prerequisites

- [Arweave wallet](https://www.arconnect.io/download)

**Optional:**

- [Turbo Credits](https://docs.ardrive.io/docs/turbo/credits/#how-to-purchase-credits) for code uploads over 100KB.

### Installing Pulumi

    curl -fsSL https://get.pulumi.com | sh

### Choosing a Backend

By default, Pulumi uses a cloud backend to store state. If you don't have a
Pulumi account, you can use a local backend.

    pulumi login file://./

This will create a `.pulumi` directory in the current working directory.

If you want to use a cloud backend, you can use the following command.

    pulumi login

You can also use S3 or an S3-compatible backend.

    pulumi login 's3://<bucket-name>?region=us-east-1&awssdk=v2&profile=<profile-name>'

    pulumi login 's3://<bucket-name>?endpoint=my.minio.local:8080&disableSSL=true&s3ForcePathStyle=true'

### Creating a Project

Run the following command and choose the TypeScript template.

    pulumi new

### Installing the Provider

    npm i @ao-tools/pulumi-ao

### Configuring the Provider

The provider requires a wallet JWK file and an optional gateway URL and scheduler ID.

> Note: Its's possible to pass these values directly to resources.

#### Required

You need to have an Arweave wallet JWK file.

    pulumi config set ao:walletPath /path/to/deployment_wallet.json

#### Optional

The gateway used to fetch code and tags from deployed processes.

    pulumi config set ao:gatewayUrl https://arweave.net

## Usage Examples

### A simple process

```typescript
import * as ao from "@ao-tools/pulumi-ao"

new ao.Process("a", {
  code: `
  local json = require("json")
  Handlers.add(
    "Info", "Info",
    function(message)
      message.reply({
        Data = json.encode({Name = Name})
      })
    end
  )`,
})
```

### Two processes that share the same code

```typescript
const code = new ao.ProcessCode("c", {
  filePath: "./path/to/code.lua",
  bundleLuaCode: true, // Optional, default is false
})

new ao.Process("a", { codeId: code.id })
new ao.Process("b", { codeId: code.id })
```

### Environment variables and custom tags

```typescript
const processA = new ao.Process("a", {
  customTags: {
    TagName: "TagValue", // Changes require a replacement (i.e., new process ID)
  },
  code: `
  local json = require("json")
  Handlers.add(
    "Info", "Info",
    function(message)
      message.reply({
        Data = json.encode({
          Name = Name,
          TagName = ao.env.Process.Tags.TagName
        })
      })
    end
  )`,
})

new ao.Process("b", {
  environment: {
    processAId: processA.id, // Changes are applied in-place (i.e., no new process ID)
  },
  // Environment variables are available in the Lua code as Environment table.
  // They are directly accessible in the Handlers and in the Init() function,
  // which will be called on create and update of the process code.
  code: `
  function Init()
    Send({Targte = Environment.processAId, Action = "Info"})
  end
`,
})
```

### Configuration overrides

```typescript
const process = new ao.Process("a", {
  schedulerId: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA", // testnet scheduler
  moduleId: "Do_Uc2Sju_ffp6Ev0AnLVdPtot15rvMjP-a9VVaA5fM", // AOS 2.0.1
  authorityId: "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY", // testnet authority
  gatewayUrl: "https://arweave.net",
  walletPath: "/path/to/process_5_wallet.json",
  codeId: code.id,
})

// Pulumi resource IDs are Arweave TX IDs and AO Process IDs.
export const processId = process.id
```
