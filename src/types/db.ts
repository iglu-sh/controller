export type uuid = `${string}-${string}-${string}-${string}-${string}`;

export type User = {
    id: uuid;
    username: string;
    password: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    last_login: Date | null;
    is_admin: boolean;
    is_verified: boolean;
    must_change_password: boolean;
    avatar_color: string;
    show_oob: boolean;
}
export type builder = {
    id: number,
    cache_id: number,
    name: string,
    description: string,
    enabled: boolean,
    trigger: string,
    cron: string,
    webhookURL: string,
}
export type builder_runs = {
    id: number,
    builder_id: number,
    status: string,
    started_at: Date | null,
    finished_at: Date | null,
    gitcommit: string,
    duration: string,
    log: string
}
export type cache_key = {
    id: number,
    cache_id: number,
    key_id: number,
    permissions: string,
    created_at: Date
}

export type cache = {
    id: number,
    githubusername: string,
    ispublic: boolean,
    name: string,
    permission: string,
    preferredcompressionmethod: string,
    uri: string,
    priority: number,
}
export type cachixconfigs = {
    id: number,
    builder_id: number,
    push: boolean,
    target: number,
    apikey: string,
    signingkey: string,
    buildoutpudir: string
}
export type git_configs = {
    id: number,
    builder_id: number,
    repository: string,
    branch: string,
    gitusername: string,
    gitkey: string,
    requiresauth: boolean,
    noclone: boolean
}
export type hashes = {
    id: number,
    path: string,
    cache: number,
    updatedat: Date | null,
    cderiver: string,
    cfilehash: string,
    cfilesize: number,
    cnarhash: string,
    cnarsize: number,
    creferences: Array<string>,
    csig: string,
    cstorehash: string,
    cstoresuffix: string,
    parts: unknown,
    compression: string
}
export type keys = {
    id: number,
    name: string,
    hash: string,
    description: string,
    created_at: Date,
    updated_at: Date,
    user_id: uuid
}
export type public_signing_keys = {
    id: number,
    name: string,
    key: string,
    description: string,
    created_at: Date
}
export type request = {
    id: number,
    fs_storage_path: string,
    log_level: string,
    max_storage_size: bigint,
    cache_root_domain: string
}
export type signing_key_cache_api_link = {
    id: number,
    cache_id: number,
    key_id: number,
    signing_key_id: number
}
export type builder_user_link = {
    id: number,
    builer_id: number,
    user_id: uuid,
}
export type cache_user_link = {
    id: number,
    cache_id: number,
    user_id: uuid,
}
export type substituter = {
    url: string,
    public_signing_keys: Array<string>
}
export type buildoptions = {
    id: number,
    builder_id: number,
    cores: number,
    maxjobs: number,
    keep_going: boolean,
    extraargs: string,
    substituters: Array<substituter>
}
export type aggregatedBuilder = {
    builder: builder,
    runs: builder_runs[],
    git_config: git_configs,
    cachix_config: cachixconfigs,
    options: buildoptions
}
export type xTheEverythingType = {
    cache: cache,
    builders: aggregatedBuilder[],
    signing_keys: public_signing_keys[],
    api_keys: keys[],
    derivation_count: number,
}