import { SupabaseDatabaseAdapter } from "@elizaos/adapter-supabase";
import { Memory, Content } from "@elizaos/core";
import { v4 as uuid } from "uuid";

// Add type: module to package.json
const pkg = {
    "type": "module"
};

async function testDatabase() {
    try {
        // Initialize database connection
        const db = new SupabaseDatabaseAdapter(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!
        );
        console.log("Database connection initialized");

        // Test account retrieval
        const defaultAccountId = "00000000-0000-0000-0000-000000000000";
        const account = await db.getAccountById(defaultAccountId);
        if (account) {
            console.log("Successfully retrieved default account");
        } else {
            throw new Error("Default account not found");
        }

        // Test cache operations
        const testKey = "test_key";
        const testValue = "test_value";
        const cacheResult = await db.setCache({
            key: testKey,
            value: testValue,
            agentId: defaultAccountId
        });
        if (cacheResult) {
            console.log("Successfully wrote to cache");
        } else {
            throw new Error("Failed to write to cache");
        }

        // Test memory operations
        const testMemory: Memory = {
            id: uuid() as `${string}-${string}-${string}-${string}-${string}`,
            userId: defaultAccountId,
            agentId: defaultAccountId,
            roomId: defaultAccountId,
            content: {
                type: "text",
                text: "Test memory"
            } as Content,
            createdAt: Date.now()
        };

        await db.createMemory(testMemory, "memories_1536");
        console.log("Successfully created test memory");

        console.log("All tests passed!");
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

testDatabase();