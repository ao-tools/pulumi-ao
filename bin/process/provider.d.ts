import * as Pulumi from "@pulumi/pulumi";
export interface ProcessProviderInputs {
    name: string;
    owner: string;
    code: string | undefined;
    codeId: string | undefined;
    moduleId: string;
    schedulerId: string;
    authorityId: string;
    tags: Record<string, string>;
    customTags: Record<string, string>;
    environment: Record<string, string>;
    walletPath: string;
    gatewayUrl: string;
}
/**
 * Uses aoconnect to manage AO processes
 */
export declare class ProcessProvider implements Pulumi.dynamic.ResourceProvider {
    /**
     * Checks that Resource inputs are valid
     * Runs every time
     */
    check(_olds: ProcessProviderInputs, news: ProcessProviderInputs): Promise<Pulumi.dynamic.CheckResult>;
    /**
     * Loads the current state of a process from AO
     * Called by pulumi refresh
     */
    read(id: string, props?: any): Promise<Pulumi.dynamic.ReadResult>;
    /**
     * Checks if a process needs to be updated or replaced
     * Called after check()
     */
    diff(_id: string, olds: ProcessProviderInputs, news: ProcessProviderInputs): Promise<Pulumi.dynamic.DiffResult>;
    /**
     * Spawns a new AO process, and sets the environment variables after creation.
     * Called after diff() when a new process is created or needs to be replaced.
     */
    create(inputs: ProcessProviderInputs): Promise<Pulumi.dynamic.CreateResult>;
    /**
     * Sends messages to the AO process to update the environment variables and code.
     * Called after diff() when a process needs to be updated.
     */
    update(id: string, olds: ProcessProviderInputs, news: ProcessProviderInputs): Promise<Pulumi.dynamic.UpdateResult>;
}
