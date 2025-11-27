{bun2nix
, glibc
, deadnix
, nixpkgs-fmt
}:

bun2nix.writeBunApplication {
  packageJson = ../../../package.json;
  src = ../../..;

  nativeBuildInputs = [
    deadnix
    nixpkgs-fmt
  ];

  buildInputs = [ glibc ];

  buildPhase = ''
    bun run build
  '';

  startScript = ''
    bun run start
  '';

  bunDeps = bun2nix.fetchBunDeps {
    bunNix = ./bun.nix;
  };
}
