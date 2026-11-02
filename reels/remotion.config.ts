import fs from "node:fs";
import { Config } from "@remotion/cli/config";

// PNG frames + low CRF keep thin logo lines crisp after Instagram re-compresses.
Config.setVideoImageFormat("png");
Config.setCrf(14);
Config.setOverwriteOutput(true);

// Cloud sessions ship a headless Chromium; use it instead of downloading one.
const cloudBrowser = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(cloudBrowser)) {
  Config.setBrowserExecutable(cloudBrowser);
}
