{ buildBunApplication
, stdenv
}:

let
  isX86_64 = stdenv.hostPlatform.system == "x86_64-linux";
in
buildBunApplication {
  src = ../../..;

  nodeModuleHash = if isX86_64 then "sha256-3xADL5KNUwkhUqCpeDDob8I3QlMnqea4vFyXY5dR8Z8=" else "sha256-mHTWjjcjdwH6UoBoPeEYFccpaWIvuhq4piGJ+Z9xPCQ=";

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
    "next"
    "styled-jsx"
    "@swc"
    "@next"
    "react"
    "caniuse-lite"
  ];

  nodeExecToKeep = [
    "next"
  ];

  buildPhase = ''
    bun run --bun build
  '';
}
