import type {cache, log, User} from "./db";

export type APIUser = Omit<User, "password">


export type derivationPackageOverview = {
    total: number,
    storage_used: number
}
export type cacheOverview = {
    audit_log: log[]
    info: cache
    packages: derivationPackageOverview
}