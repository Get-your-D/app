export type TestResultClaim = {
    testResultId: string;
    claimedByUserId: string;
    claimedAt: string;
};

type TestResultStore = {
    claims: Record<string, TestResultClaim>;
};

declare global {
    var __testResultStore: TestResultStore | undefined;
}

if (!globalThis.__testResultStore) {
    globalThis.__testResultStore = {
        claims: {},
    };
}

export const testResultStore = globalThis.__testResultStore;
