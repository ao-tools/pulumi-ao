import * as Pulumi from "@pulumi/pulumi";
export interface ProcessInputProps {
    code?: Pulumi.Input<string>;
    codeId?: Pulumi.Input<string>;
    name?: Pulumi.Input<string>;
    customTags?: Pulumi.Input<Record<string, string>>;
    gatewayUrl?: Pulumi.Input<string>;
    walletPath?: Pulumi.Input<string>;
    environment?: Pulumi.Input<Record<string, string>>;
    moduleId?: Pulumi.Input<string>;
    schedulerId?: Pulumi.Input<string>;
    authorityId?: Pulumi.Input<string>;
}
/**
 * Represents a process on AO
 * Executes Lua code on spawn and sets global Environment variables.
 */
export declare class Process extends Pulumi.dynamic.Resource {
    readonly owner: Pulumi.Output<string>;
    readonly name: Pulumi.Output<string>;
    readonly code: Pulumi.Output<string>;
    readonly codeId: Pulumi.Output<string>;
    readonly gatewayUrl: Pulumi.Output<string>;
    readonly walletPath: Pulumi.Output<string>;
    readonly moduleId: Pulumi.Output<string>;
    readonly schedulerId: Pulumi.Output<string>;
    readonly authority: Pulumi.Output<string>;
    readonly customTags: Pulumi.Output<Record<string, string>>;
    readonly environment: Pulumi.Output<Record<string, string>>;
    readonly tags: Pulumi.Output<Record<string, string>>;
    constructor(name: string, inputProps: ProcessInputProps, options?: Pulumi.CustomResourceOptions);
}
