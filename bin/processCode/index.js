"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessCode = void 0;
const Pulumi = require("@pulumi/pulumi");
const provider_1 = require("./provider");
/**
 * Represents a Lua code upload to Arweave.
 * Will bundle Lua code before uploading.
 * Uses the Turbo SDK for uploads.
 * The id is the Arweave TX ID and can be passed to Process resources.
 */
class ProcessCode extends Pulumi.dynamic.Resource {
    constructor(name, inputProps, opts) {
        inputProps.name = inputProps.name ?? name;
        const config = new Pulumi.Config("ao");
        inputProps.walletPath =
            inputProps.walletPath ?? config.require("walletPath");
        // These props can't directly be set by the user
        const outputProps = { owner: null, sha256: null };
        const allProps = { ...inputProps, ...outputProps };
        super(new provider_1.ProcessCodeProvider(), name, allProps, opts, "ao", "ProcessCode");
    }
}
exports.ProcessCode = ProcessCode;
//# sourceMappingURL=index.js.map