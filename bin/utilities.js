"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStream = exports.getSizeInBytes = exports.hashText = exports.bundleLuaCode = exports.retry = exports.loadProcessTx = exports.loadCode = exports.loadWallet = exports.isTxId = exports.isPulumiOutput = exports.tagsArrayToObject = exports.tagsObjectToArray = void 0;
const fs = require("fs");
const crypto = require("crypto");
const stream = require("stream");
const LuaBundle = require("luabundle");
const tagsObjectToArray = (tags) => Object.entries(tags).map(([name, value]) => ({ name, value }));
exports.tagsObjectToArray = tagsObjectToArray;
const tagsArrayToObject = (tags) => tags.reduce((acc, t) => ({ ...acc, [t.name]: t.value }), {});
exports.tagsArrayToObject = tagsArrayToObject;
// Inputs that come from outputs are unknown at check time, but they all have the same string
const isPulumiOutput = (value) => value === "04da6b54-80e4-46f7-96ec-b56ff0331ba9";
exports.isPulumiOutput = isPulumiOutput;
const isTxId = (id) => (0, exports.isPulumiOutput)(id) || /^[a-zA-Z0-9-_]{43}$/.test(id);
exports.isTxId = isTxId;
const loadWallet = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
exports.loadWallet = loadWallet;
const loadCode = async (gatewayUrl, id) => await fetch(gatewayUrl + "/" + id).then((r) => r.text());
exports.loadCode = loadCode;
const loadProcessTx = async (gatewayUrl, id) => {
    const query = `
    {
      transaction(id: "${id}") {
        id
        owner {address}
        tags {name value}
      }
    }`;
    return await fetch(gatewayUrl + "/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    })
        .then((r) => r.json())
        .then((r) => r.data.transaction);
};
exports.loadProcessTx = loadProcessTx;
const retry = async (retries, fn) => {
    let result = await fn();
    while (retries > 0) {
        try {
            result = await fn();
            break;
        }
        catch (e) {
            retries--;
            if (retries === 0)
                throw e;
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
    return result;
};
exports.retry = retry;
const bundleLuaCode = (path) => LuaBundle.bundle(path, {
    ignoredModuleNames: ["json", ".crypto", ".base64", ".pretty", ".utils"],
});
exports.bundleLuaCode = bundleLuaCode;
const hashText = (text) => {
    const hash = crypto.createHash("sha256");
    hash.update(text);
    return hash.digest("base64");
};
exports.hashText = hashText;
const getSizeInBytes = (text) => Buffer.byteLength(text, "utf8");
exports.getSizeInBytes = getSizeInBytes;
const createStream = (codeBundle) => {
    const codeBundleStream = new stream.Readable();
    codeBundleStream.push(codeBundle);
    codeBundleStream.push(null);
    return codeBundleStream;
};
exports.createStream = createStream;
//# sourceMappingURL=utilities.js.map