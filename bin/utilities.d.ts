import stream = require("stream");
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export type ArweaveTx = {
    id: string;
    owner: {
        address: string;
    };
    tags: {
        name: string;
        value: string;
    }[];
};
export declare const tagsObjectToArray: (tags: Record<string, string>) => {
    name: string;
    value: string;
}[];
export declare const tagsArrayToObject: (tags: {
    name: string;
    value: string;
}[]) => Record<string, string>;
export declare const isPulumiOutput: (value: string) => value is "04da6b54-80e4-46f7-96ec-b56ff0331ba9";
export declare const isTxId: (id: string) => boolean;
export declare const loadWallet: (path: string) => JsonWebKey;
export declare const loadCode: (gatewayUrl: string, id: string) => Promise<string>;
export declare const loadProcessTx: (gatewayUrl: string, id: string) => Promise<ArweaveTx>;
export declare const retry: <T>(retries: number, fn: () => Promise<T>) => Promise<T>;
export declare const bundleLuaCode: (path: string) => string;
export declare const hashText: (text: string) => string;
export declare const getSizeInBytes: (text: string) => number;
export declare const createStream: (codeBundle: string) => stream.Readable;
