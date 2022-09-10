import path from "path";
import { defineConfig, loadEnv } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueSetupExtend from "vite-plugin-vue-setup-extend";
import vue from "@vitejs/plugin-vue";

const resolve = (dir) => {
  return path.join(__dirname, "./", dir);
};

export default defineConfig(({ command }) => {
  return {
    build: {
      minify: false,
      commonjsOptions: {
        esmExternals: true,
      },
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        name: "vueCanvasTable",
        fileName: (format: string) => `vueCanvasTable.${format}.js`,
      },
      rollupOptions: {
        external: ["vue", "pinia"],
        output: {
          globals: {
            vue: "Vue",
            pinia: "Pinia",
          },
        },
      },
    },
    resolve: {
      alias: [
        {
          find: "$vct",
          replacement: resolve("src"),
        },
      ],
    },
    plugins: [vue(), vueJsx(), vueSetupExtend()],
  };
});
