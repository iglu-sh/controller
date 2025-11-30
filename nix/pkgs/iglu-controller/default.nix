{ bun2nix
, glibc
, deadnix
, nixpkgs-fmt
, nix
}:

bun2nix.writeBunApplication {
  packageJson = ../../../package.json;
  src = ../../..;

  nativeBuildInputs = [
    deadnix
    nixpkgs-fmt
  ];

  buildInputs = [
    glibc
    nix
  ];

  buildPhase = ''
    bun run build
  '';

  startScript = ''
    bun --bun run next start
  '';

  bunDeps = bun2nix.fetchBunDeps {
    bunNix = ./bun.nix;
  };
}
