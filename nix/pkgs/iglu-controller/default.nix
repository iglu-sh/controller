{ buildBunApplication
, stdenv
}:

let
  isX86_64 = stdenv.hostPlatform.system == "x86_64-linux";
in
buildBunApplication {
  src = ../../..;

  nodeModuleHash = if isX86_64 then "sha256-NaFGEX3tbUMDUNZaRwsGBP3IKHXbPhQZjyQMaUUjlDM=" else "sha256-FvrT1L+5T9HkVmpadb4Z2KBaCQiXG9K1xFYbH0rhZlw=";

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
