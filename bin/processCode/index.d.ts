import * as Pulumi from "@pulumi/pulumi";
export interface ProcessCodeInputProps {
    name?: Pulumi.Input<string>;
    walletPath?: Pulumi.Input<string>;
    filePath: Pulumi.Input<string>;
}
/**
 * Represents a Lua code upload to Arweave.
 * Will bundle Lua code before uploading.
 * Uses the Turbo SDK for uploads.
 * The id is the Arweave TX ID and can be passed to Process resources.
 */
export declare class ProcessCode extends Pulumi.dynamic.Resource {
    readonly name: Pulumi.Output<string>;
    readonly walletPath: Pulumi.Output<string>;
    readonly owner: Pulumi.Output<string>;
    constructor(name: string, inputProps: ProcessCodeInputProps, opts?: Pulumi.CustomResourceOptions);
}
