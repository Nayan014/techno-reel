import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// A Studio process previews one selected project, including only its local scenes.
// @ts-expect-error Node-only JavaScript configuration helper.
import { projectWebpack } from "./scripts/webpack.mjs";
Config.overrideWebpackConfig(projectWebpack(process.env.REEL_PROJECT || "example"));
