import * as path from "path"

import * as Config from "./../Config"
import * as Platform from "./../Platform"

import * as Process from "./../Plugins/Api/Process"

import { Session } from "./Session"

// Most of the paths coming in the packaged binary reference the `app.asar`,
// but the binaries (Neovim) as well as the .vim files are unpacked,
// so these need to be mapped to the `app.asar.unpacked` directory
const remapPathToUnpackedAsar = (originalPath: string) => {
    return originalPath.split("app.asar").join("app.asar.unpacked")
}

export const startNeovim = (runtimePaths: string[], args: string[]): Session => {

    const noopInitVimPath = remapPathToUnpackedAsar(path.join(__dirname, "vim", "noop.vim"))

    const nvimWindowsProcessPath = path.join(__dirname, "bin", "x86", "Neovim", "bin", "nvim.exe")
    const nvimMacProcessPath = path.join(__dirname, "bin", "osx", "neovim", "bin", "nvim")

    // For Linux, assume there is a locally installed neovim
    const nvimLinuxPath = "nvim"

    let nvimProcessPath = Platform.isWindows() ? nvimWindowsProcessPath : Platform.isMac() ? nvimMacProcessPath : nvimLinuxPath

    nvimProcessPath = remapPathToUnpackedAsar(nvimProcessPath)

    const joinedRuntimePaths = runtimePaths
                                    .map((p) => remapPathToUnpackedAsar(p))
                                    .join(",")

    const shouldLoadInitVim = Config.instance().getValue("oni.loadInitVim")
    const useDefaultConfig = Config.instance().getValue("oni.useDefaultConfig")

    const vimRcArg = (shouldLoadInitVim || !useDefaultConfig) ? [] : ["-u", noopInitVimPath]

    const argsToPass = vimRcArg
        .concat(["--cmd", `let &rtp.='${joinedRuntimePaths}'`, "--cmd", "let g:gui_oni = 1", "-N", "--embed", "--"])
        .concat(args)

    const nvimProc = new Process.Process().spawnProcess(nvimProcessPath, argsToPass)

    console.log(`Starting Neovim - process: ${nvimProc.pid}`) // tslint:disable-line no-console

    return new Session(nvimProc.stdin, nvimProc.stdout)
}
