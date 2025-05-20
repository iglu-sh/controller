{ lib
, stdenv
, bun
, nodejs-slim_latest
, makeWrapper
}:

let
  inherit (packageJSON) version;
  src = ../../..;
  packageJSON = lib.importJSON "${src}/package.json";
  pname = packageJSON.name;

  isX86_64 = stdenv.hostPlatform.system == "x86_64-linux";

  nodeModules = stdenv.mkDerivation {
    pname = "${pname}_node-modules";
    inherit src version;

    nativeBuildInputs = [ bun ];
    buildInputs = [ nodejs-slim_latest ];

    dontConfigure = true;
    dontFixup = true;

    buildPhase = ''
      runHook preBuild

      export HOME=$TMPDIR

      bun install --no-progress --frozen-lockfile

      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall

      mkdir -p $out/node_modules
      mv node_modules $out/

      runHook postInstall
    '';

    outputHash = if isX86_64 then "sha256-iJfo8sXM/CJ9rVaDRNlYVGvCziYYFDtzfSrAns1oOH4=" else "sha256-ct6pS4kpiiT/kxbesaXhMgRlq2ymL3ht4sOKvjHewns=";
    outputHashAlgo = "sha256";
    outputHashMode = "recursive";
  };
in
stdenv.mkDerivation rec{
  inherit src pname version;

  nativeBuildInputs = [
    nodeModules
    makeWrapper
    nodejs-slim_latest
  ];

  buildInputs = [ bun ];

  configurePhase = ''
    runHook preConfigure

    cp -a ${nodeModules}/node_modules ./node_modules
    chmod -R u+rw node_modules
    chmod -R u+x node_modules/.bin
    patchShebangs node_modules iglu-controller.sh
    
    export HOME=$TMPDIR
    export PATH="$PWD/node_modules/.bin:$PATH"

    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild
    
    bun run build

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/share/${pname}/node_modules/.bin
    mkdir $out/bin
    
    # Install needed node_modules
    cp -r ./node_modules/.bin/next $out/share/${pname}/node_modules/.bin/
    cp -r ./node_modules/next $out/share/${pname}/node_modules/
    cp -r ./node_modules/styled-jsx $out/share/${pname}/node_modules/
    cp -r ./node_modules/@swc $out/share/${pname}/node_modules/
    cp -r ./node_modules/@next $out/share/${pname}/node_modules/
    cp -r ./node_modules/react $out/share/${pname}/node_modules/
    cp -r ./node_modules/caniuse-lite $out/share/${pname}/node_modules/

    cp $src/next.config.ts $out/share/${pname}/
    cp $src/package.json $out/share/${pname}/
    cp -r .next $out/share/${pname}/
    cp $src/iglu-controller.sh $out/bin/iglu-controller

    chmod +x $out/bin/iglu-controller

    substituteInPlace $out/bin/iglu-controller \
      --replace-fail 'CWD' $out/share/iglu-controller

    runHook postInstall
  '';

  postInstall = ''
    wrapProgram $out/bin/iglu-controller \
      --prefix PATH : ${
        lib.makeBinPath[
          bun
        ]
      }
  '';
}
