import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import viteCompression from "vite-plugin-compression";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        viteCompression()
    ],
    clearScreen: false,
    envDir: './',
    define: {
        "import.meta.env.VITE_SERVER_PORT": JSON.stringify(process.env.SERVER_PORT || 3000),
    },
    build: {
        outDir: "dist",
        minify: true,
        cssMinify: true,
        sourcemap: false,
        cssCodeSplit: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, './src'),
        },
    },
});
