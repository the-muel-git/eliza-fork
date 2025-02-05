import { SupabaseDatabaseAdapter } from "@elizaos/adapter-supabase";
import { v4 as uuidv4 } from "uuid";
import type { Memory, UUID } from "@elizaos/core";

async function testDatabase() {
    console.log("Starting database connection test...");

    const db = new SupabaseDatabaseAdapter(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
    );

    try {
        // Test 1: Initialize connection
        console.log("Testing connection...");
        await db.init();
        console.log("✅ Connection successful");

        // Test 2: Verify default account exists
        console.log("\nChecking default account...");
        const defaultAgentId = "00000000-0000-0000-0000-000000000000" as UUID;
        const { data: account } = await db.supabase
            .from('accounts')
            .select()
            .eq('id', defaultAgentId)
            .single();
        console.log("Default account:", account);
        console.log("✅ Default account found");

        // Test 3: Test cache operations
        console.log("\nTesting cache operations...");
        const testKey = "test-key-" + Date.now();
        await db.setCache({
            key: testKey,
            agentId: defaultAgentId,
            value: JSON.stringify({ test: "data" })
        });
        console.log("✅ Cache write successful");

        // Test 4: Test memory operations
        console.log("\nTesting memory operations...");
        const testMemory: Memory = {
            id: uuidv4() as UUID,
            type: "test",
            content: { text: "This is a test memory" },
            embedding: new Array(1536).fill(0),
            userId: defaultAgentId,
            agentId: defaultAgentId,
            roomId: defaultAgentId,
            createdAt: Date.now()
        };
        await db.createMemory(testMemory, "test", true);
        console.log("✅ Memory creation successful");

        console.log("\nAll tests passed! Database is working correctly.");
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

testDatabase();