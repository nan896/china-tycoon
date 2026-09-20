import { defineConfig } from 'vite';
export default defineConfig({server:{host:'0.0.0.0',port:5173,proxy:{'/socket.io':'http://localhost:4173','/api':'http://localhost:4173'}},build:{outDir:'dist'}});
