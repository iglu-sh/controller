{ buildBunApplication
, stdenv
}:

let
  isX86_64 = stdenv.hostPlatform.system == "x86_64-linux";
in
buildBunApplication {
  src = ../../..;

  nodeModuleHash = if isX86_64 then "sha256-m5GhSQAs3ta8qnMvFSJfCp+82n/dTsyYnTNrFd7MXgE=" else "sha256-nqFfzDo+24Tiz02CdlbarKajCEisu0jbHfTBKOA5/9I=";

  bunExtraArgs = "--bun";
  bunScript = "start";

  filesToInstall = [
    "src"
    "public"
    "next.config.ts"
  ];

  buildOutput = [
    ".next"
  ];

  nodeModulesToKeep = [
    "."
  ];

  nodeExecToKeep = [
    "next"
  ];

  buildPhase = ''
    bun run --bun build
  '';
}
