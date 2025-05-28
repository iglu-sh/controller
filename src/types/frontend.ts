export type PublicSigningKey = {
    id: number,
    name: string,
    key: string,
    description: string
    created_at: Date
}
export type FrontendKey = {
    publicsigningkeys: Array<PublicSigningKey>,
    //Cache Name and ID
    name: string,
    id: string
}

export type CacheCreationRequest = {
    name: string,
    githubUsername: string,
    public: boolean,
    compression: "XZ" | "ZSTD",
    priority: number,
    enableBuilder: boolean,
    publicSigningKey: number
}