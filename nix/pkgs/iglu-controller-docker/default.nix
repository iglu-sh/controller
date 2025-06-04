{ dockerTools
, iglu
, bash
, stdenv
}:

let
  archType = if (stdenv.hostPlatform.system == "x86_64-linux") then "amd64" else "arm64";
in
dockerTools.buildImage {
  name = "iglu-controller-docker";
  tag = "v${iglu.iglu-controller.version}-${archType}";

  copyToRoot = [
    iglu.iglu-controller
    bash
  ];

  config = {
    ExposedPorts = {
      "3000/tcp" = { };
    };
    Cmd = [ "/bin/iglu-controller" ];
  };
}
