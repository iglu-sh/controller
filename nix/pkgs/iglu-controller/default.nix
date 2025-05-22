{ buildBunApplication
, stdenv
}:

let
  isX86_64 = stdenv.hostPlatform.system == "x86_64-linux";
in
buildBunApplication {
  src = ../../..;

  nodeModuleHash = if isX86_64 then "sha256-iJfo8sXM/CJ9rVaDRNlYVGvCziYYFDtzfSrAns1oOH4" else "sha256-ct6pS4kpiiT/kxbesaXhMgRlq2ymL3ht4sOKvjHewns=";

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
