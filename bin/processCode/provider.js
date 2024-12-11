"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessCodeProvider = void 0;
const TurboSdk = require("@ardrive/turbo-sdk");
const Utils = require("../utilities");
/**
 * This dynamic resource provider uploads Lua files to Arweave
 * It uses luabundle to bundle all code into one file.
 * It uses turbo-sdk to upload the file to Arweave.
 */
class ProcessCodeProvider {
    async create(inputs) {
        const turboClient = TurboSdk.TurboFactory.authenticated({
            privateKey: Utils.loadWallet(inputs.walletPath),
        });
        const codeBundle = Utils.bundleLuaCode(inputs.filePath);
        const digest = Utils.hashText(codeBundle);
        const result = await turboClient.uploadFile({
            fileSizeFactory: () => Utils.getSizeInBytes(codeBundle),
            fileStreamFactory: () => Utils.createStream(codeBundle),
            dataItemOpts: {
                tags: [
                    { name: "Name", value: inputs.name },
                    { name: "Sha256", value: digest },
                ],
            },
        });
        return {
            id: result.id,
            outs: {
                name: inputs.name,
                owner: result.owner,
                filePath: inputs.filePath,
                sha256: digest,
            },
        };
    }
    /**
     * Uses compares hashes of the code bundles to check for changes.
     * Called on every update.
     */
    async diff(_id, olds, news) {
        const diffResult = {
            changes: false,
        };
        const replaces = [];
        if (olds.name !== news.name)
            replaces.push("name");
        if (olds.filePath !== news.filePath)
            replaces.push("filePath");
        const codeBundle = Utils.bundleLuaCode(news.filePath);
        const newSha256 = Utils.hashText(codeBundle);
        if (newSha256 !== olds.sha256)
            replaces.push("sha256");
        if (replaces.length > 0) {
            diffResult.changes = true;
            diffResult.replaces = replaces;
        }
        return diffResult;
    }
}
exports.ProcessCodeProvider = ProcessCodeProvider;
//# sourceMappingURL=provider.js.map