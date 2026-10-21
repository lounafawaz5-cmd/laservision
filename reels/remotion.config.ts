import fs from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Cloud sessions ship a headless Chromium; use it instead of downloading one.
const cloudBrowser = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(cloudBrowser)) {
  Config.setBrowserExecutable(cloudBrowser);
}
