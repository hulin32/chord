import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./lib/test-setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            '@/lib': path.resolve(__dirname, './lib'),
            '@/components': path.resolve(__dirname, './components'),
        },
    },
})