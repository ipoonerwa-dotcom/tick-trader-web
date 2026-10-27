import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development /api goes to the desk bot through an SSH tunnel:
//   ssh -i wskey.pem -N -L 8790:127.0.0.1:8790 ubuntu@<server>
export default defineConfig({
  plugins: [react()],
  server: { port: 5190, proxy: { "/api": "http://127.0.0.1:8790" } },
});
