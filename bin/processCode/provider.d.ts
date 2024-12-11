import * as Pulumi from "@pulumi/pulumi";
export interface ProcessCodeProviderInputs {
    name: string;
    owner: string | null;
    filePath: string;
    walletPath: string;
    sha256: string | null;
}
/**
 * This dynamic resource provider uploads Lua files to Arweave
 * It uses luabundle to bundle all code into one file.
 * It uses turbo-sdk to upload the file to Arweave.
 */
export declare class ProcessCodeProvider implements Pulumi.dynamic.ResourceProvider {
    create(inputs: ProcessCodeProviderInputs): Promise<Pulumi.dynamic.CreateResult>;
    /**
     * Uses compares hashes of the code bundles to check for changes.
     * Called on every update.
     */
    diff(_id: string, olds: ProcessCodeProviderInputs, news: ProcessCodeProviderInputs): Promise<Pulumi.dynamic.DiffResult>;
}
