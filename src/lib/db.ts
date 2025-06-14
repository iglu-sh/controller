import {Client} from "pg";
import 'dotenv/config'
import {builderDatabaseRepresenation, cache, cacheCreationObject, key, userInfoObject} from "@/types/api";
import {CacheCreationRequest, FrontendKey} from "@/types/frontend";
import {builder, builderDatabase, builderFrontendPackage, dbBuilder} from "@/types/db";

export default class Database{
    client: Client;

    constructor(){
        console.log(process.env.DATABASE_URL)
        if(!process.env.DATABASE_URL){
            console.error('DATABASE_URL not set');
            return
        }

        this.client = new Client(
            {
                connectionString: process.env.DATABASE_URL,
            }
        );
        this.client.connect().then(() => {
            console.log('Connected to database');
        }).catch((err) => {
            console.error('Error connecting to database', err);
            throw new Error(`Error connecting to database ${err}`)
        });
    }
    public async createFrontendTables(){
        await this.client.query(`
            CREATE TABLE IF NOT EXISTS cache.builder (
                id serial NOT NULL UNIQUE primary key,
                cache_id INTEGER NOT NULL CONSTRAINT builder_cache_fk REFERENCES cache.caches,
                name TEXT NOT NULL,
                description TEXT,
                enabled bool NOT NULL,
                trigger TEXT,
                cron TEXT,
                webhookURL TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS cache.git_configs (
                id serial NOT NULL UNIQUE primary key,
                builder_id INTEGER NOT NULL CONSTRAINT git_builder_fk REFERENCES cache.builder ON DELETE CASCADE,
                repository TEXT,
                branch TEXT,
                gitUsername TEXT,
                gitKey TEXT,
                requiresAuth BOOL NOT NULL,
                noClone BOOL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS cache.buildOptions (
                id serial NOT NULL UNIQUE primary key,
                builder_id INTEGER NOT NULL CONSTRAINT options_build_fk REFERENCES cache.builder ON DELETE CASCADE,
                cores INTEGER,
                maxJobs INTEGER,
                keep_going BOOL,
                extraArgs TEXT,
                substituters TEXT NOT NULL DEFAULT 'https://cache.nixos.org',
                trustedPublicKeys TEXT NOT NULL DEFAULT 'cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY=',
                parallelBuilds BOOL NOT NULL,
                command TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS cache.cachixConfigs (
                id serial NOT NULL UNIQUE primary key,
                builder_id INTEGER NOT NULL CONSTRAINT options_build_fk REFERENCES cache.builder ON DELETE CASCADE ,
                push BOOL NOT NULL,
                target INTEGER NOT NULL CONSTRAINT cachix_target_fk REFERENCES cache.caches,
                apiKey TEXT NOT NULL,
                signingKey TEXT NOT NULL,
                buildOutputDir TEXT NOT NULL
            );
            create table if not exists cache.builder_runs
            (
                id serial constraint builder_runs_pk primary key,
                builder_id int constraint builder_fk references cache.builder ON DELETE CASCADE,
                status text not null,
                started_at timestamp default now() not null,
                ended_at timestamp,
                gitCommit text not null,
                duration interval not null, -- in seconds
                log text
            )
        `)
    }
    private getHashedKey(key:string):string{
        const hasher = new Bun.CryptoHasher("sha512");
        hasher.update(key);
        return hasher.digest('hex');
    }
    async close(){
        console.log('Database closed');
        await this.client.end();
    }
    async connect(){
        console.log('Connecting to database');
        await this.client.connect();
        console.log('Connected to database');
    }
    async updateCache(id:string, cache:cache){
        //Check if a cache with that name exists
        const check = await this.client.query(`
            SELECT * FROM cache.caches WHERE name = $1
        `, [cache.name]);
        if(check.rows.length > 0 && check.rows[0].id.toString() !== id){
            throw new Error("-1")
        }

        await this.client.query(`
            UPDATE cache.caches SET (name, githubusername, ispublic, preferredcompressionmethod, priority) = ($1, $2, $3, $4, $5) WHERE id = $6;
        `, [cache.name, cache.githubusername, cache.ispublic, cache.preferredcompressionmethod, cache.priority, id]);
    }

    async getCachesForKey(key: string):Promise<cache[]>{
        const hash = this.getHashedKey(key);
        const res = await this.client.query(`
            SELECT c.*, json_agg(psk.*) as publicsigningkeys
            FROM cache.keys 
                INNER JOIN cache.cache_key ON keys.id = cache_key.key_id
                INNER JOIN cache.caches c ON c.id = cache_key.cache_id 
                INNER JOIN cache.signing_key_cache_api_link skcal ON c.id = skcal.cache_id
                INNER JOIN cache.public_signing_keys psk ON skcal.signing_key_id = psk.id
            WHERE hash = $1
            GROUP BY c.id;
        `, [hash]);
        return res.rows;
    }

    async createCache(info:CacheCreationRequest, owner:string):Promise<cache>{

        //Check if the cache already exists
        const check = await this.client.query(`
            SELECT * FROM cache.caches WHERE name = $1
        `, [info.name]);
        if(check.rows.length > 0){
            throw new Error("-1")
        }

        const createdCache = await this.client.query(`
        INSERT INTO cache.caches (githubusername, ispublic, name, permission, preferredcompressionmethod, uri, priority)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
        `,
        [info.githubUsername, info.public, info.name, "Read", info.compression.toUpperCase(), process.env.NEXT_PUBLIC_CACHE_URL, info.priority])

        if(!createdCache.rows || createdCache.rows.length === 0){
            throw new Error("Error creating cache")
        }

        //Create the key in the keys table (but only if the publickey is not -1, which indicates that the user chose not to use an existing one)
        if(info.publicSigningKey == -1){
            const key = this.getHashedKey(owner);
            const cacheId = createdCache.rows[0].id;
            const keyResult = await this.client.query(`
                SELECT * FROM cache.keys WHERE hash = $1
            `, [key]);
            if(!keyResult.rows || keyResult.rows.length === 0){
                throw new Error("Error creating key")
            }
            const keyId = keyResult.rows[0].id;
            await this.client.query(`
                INSERT INTO cache.cache_key (cache_id, key_id) VALUES($1, $2)
            `, [cacheId, keyId]);
        }
        return {
            id: createdCache.rows[0].id,
            name: createdCache.rows[0].name,
            uri: createdCache.rows[0].uri,
            ispublic: createdCache.rows[0].ispublic,
            publicsigningkeys: createdCache.rows[0].publicsigningkeys,
            priority: createdCache.rows[0].priority,
            preferredcompressionmethod: createdCache.rows[0].preferredcompressionmethod,
            githubusername: createdCache.rows[0].githubusername,
            permission: createdCache.rows[0].permission,
            problems: []
        }
    }

    async getPublicSigningKeysForKey(key:string):Promise<FrontendKey[]>{
        const hash = this.getHashedKey(key);
        const res = await this.client.query(`
            SELECT json_agg(psk.*) as publicsigningkeys, caches.name, caches.id 
            FROM cache.caches
                     INNER JOIN cache.cache_key ON caches.id = cache_key.cache_id
                     INNER JOIN cache.keys ON cache_key.key_id = keys.id
                     INNER JOIN cache.signing_key_cache_api_link skcal ON skcal.cache_id = caches.id
                     INNER JOIN cache.public_signing_keys psk ON psk.id = skcal.signing_key_id
            WHERE keys.hash = $1 AND psk.key != \'\'
            GROUP BY caches.id;
        `, [hash]);
        if(res.rows.length === 0){
            return []
        }
        console.log(res.rows[0])
        return res.rows.map((row)=>{
            return {"name":row.name, "publicsigningkeys": row.publicsigningkeys, "id": row.id} as FrontendKey;
        });
    }

    /*
    * Gets the cache information for a given cacheID and API Key
    * @param id - The ID of the cache to get information for.
    * @param apiKey - The API key to authenticate the request.
    * @return The cache information object containing the cache details.
    * @throws Error if the cache is not found or if the API key is invalid / not associated with the cache.
    * */
    public async getCacheById(id:string, apiKey:string){
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT caches.* FROM cache.caches
                 INNER JOIN cache.cache_key ON caches.id = cache_key.cache_id
                 INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE caches.id = $1 AND keys.hash = $2
        `, [id, hash]);
        if(res.rows.length === 0){
            throw new Error("Cache not found")
        }
        return res.rows[0];
    }

    public async getStorageStats(id:string, apiKey:string){
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT sum(cfilesize) as total_size, count(*) as store_hashes
            FROM cache.hashes
                INNER JOIN cache.caches c on hashes.cache = c.id
                INNER JOIN cache.cache_key ON c.id = cache_key.cache_id
                INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE cache = $1
              AND keys.hash = $2; 
        `, [id, hash]);
        return {
            storageUsed: res.rows[0].total_size,
            storeHashes: res.rows[0].store_hashes
        };
    }
    public async getTrafficStats(id:string, apiKey:string){
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT date_bin('1 day', request.time, '2025-05-01') as time,
                   count(*) as Total, request.type
            FROM cache.request
                INNER JOIN cache.caches c on request.cache_id = c.id
                INNER JOIN cache.cache_key ON c.id = cache_key.cache_id
                INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE request.cache_id = $1
              AND keys.hash = $2
              AND request.time > now() - INTERVAL '30 days'
            GROUP BY 1, request.type
            ORDER BY time;
        `, [id, hash]);
        return res.rows
    }

    public async getNewestAddedHashes(id:string, apiKey:string){
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT hashes.* FROM cache.hashes
                INNER JOIN cache.caches c on hashes.cache = c.id
                INNER JOIN cache.cache_key ON c.id = cache_key.cache_id
                INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE cache = $1
                AND keys.hash = $2
            ORDER BY updatedat DESC
            LIMIT 10;
        `, [id, hash]);
        return res.rows
    }

    public async getTopRequestedHashes(id:string, apiKey:string){
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT request.hash, h.*, count(*) as total
            FROM cache.request
                INNER JOIN cache.caches c on request.cache_id = c.id
                INNER JOIN cache.hashes h on request.hash = h.id
                INNER JOIN cache.cache_key ON c.id = cache_key.cache_id
                INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE keys.hash = $1 
                AND request.type = 'outbound'
            GROUP BY request.hash, h.id
            ORDER BY total DESC
            LIMIT 10;
        `, [hash]);
        return res.rows
    }

    public async getTopCaches(apikey:string):Promise<{cache:number, sum:number}[]>{
        const hash = this.getHashedKey(apikey);
        return await this.client.query(`
            SELECT cache, sum(cfilesize) as size FROM cache.hashes
                INNER JOIN cache.caches c on hashes.cache = c.id
                INNER JOIN cache.cache_key ON c.id = cache_key.cache_id
                INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE keys.hash = $1 
            GROUP BY cache ORDER BY sum(cfilesize) DESC LIMIT 10;
        `, [hash]).then((res)=>{return res.rows})
    }

    public async getHashesCountByKey(apiKey:string):Promise<number>{
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT count(*) as count FROM cache.hashes
                INNER JOIN cache.caches c on hashes.cache = c.id
                INNER JOIN cache.cache_key ON c.id = cache_key.cache_id
                INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE keys.hash = $1;
        `, [hash]);
        return res.rows[0].count;
    }

    public async getUserInformation(apikey:string):Promise<userInfoObject>{
        const hash = this.getHashedKey(apikey);
        //Get all the caches this user has access to
        const caches = await this.client.query(`
            SELECT caches.* FROM cache.caches
                 INNER JOIN cache.cache_key ON caches.id = cache_key.cache_id
                 INNER JOIN cache.keys ON cache_key.key_id = keys.id
            WHERE keys.hash = $1 
            `,
            [hash]);
        //Loop over the caches and add them to the return object
        let cacheList:userInfoObject = {
            caches: [],
            newestCashedHashes: [],
            biggestCaches: [],
            topRequestedHashes: [],
            hashCount: 0
        };

        for(const cache of caches.rows){
            cacheList.caches.push(cache);
            cacheList.newestCashedHashes = await this.getNewestAddedHashes(cache.id, apikey);
            cacheList.topRequestedHashes = await this.getTopRequestedHashes(cache.id, apikey);
        }

        cacheList.hashCount = await this.getHashesCountByKey(apikey);
        cacheList.biggestCaches = await this.getTopCaches(apikey);
        return cacheList;
    }
    public async checkKeyForCache(cache_id:string, apiKey:string):Promise<boolean>{
        const hash = this.getHashedKey(apiKey);
        console.log('Checking key for cache', cache_id, apiKey);
        const res = await this.client.query(`
            SELECT * FROM cache.cache_key
            WHERE cache_id = $1 AND key_id = (SELECT id FROM cache.keys WHERE hash = $2)
        `, [cache_id, hash]);
        if(res.rows.length === 0){
            return false;
        }
        return true;
    }
    public async getKeysForCache(cache_id:string, apiKey:string):Promise<key[]>{
        const isAuthenticated = await this.checkKeyForCache(cache_id, apiKey);
        //If the key is not authenticated then return an empty array
        if(!isAuthenticated){
            throw new Error("Key not authenticated")
        }
        const keys = await this.client.query(`
            SELECT keys.id, cache_id, name, description, keys.created_at, permissions 
            FROM cache.keys 
                INNER JOIN cache.cache_key ON keys.id = cache_key.key_id
            WHERE cache_id = $1
        `, [cache_id]);
        //If there are no keys found then the key provided is not valid
        if(keys.rows.length === 0){
            throw new Error("No keys found")
        }

        //If the key is found then return the keys
        return keys.rows;
    }
    public async getKeyIDForKey(apiKey:string):Promise<string>{
        const hash = this.getHashedKey(apiKey);
        console.log(hash)
        return await this.client.query(`
            SELECT keys.id FROM cache.keys
                WHERE keys.hash = $1;
        `, [hash]).then((res)=>res.rows[0].id)
    }

    /*
    * Gets all the keys a specific other api key has access too (via the cacheID)
    * @param apiKey - The API key to check.
    * @param excludedCache - The cache ID to exclude from the results.
    * @returns An array of keys that the user has access to, excluding the specified cache.
    * @throws ClientError if the sql statement fails
    * */
    public async getKeysForUser(apiKey:string, excludedCache:string):Promise<key[]>{
        const hash = this.getHashedKey(apiKey);
        const keys = await this.client.query(`
            SELECT keys.id, cache_id, name, description, keys.created_at, permissions
            FROM cache.keys
                     INNER JOIN cache.cache_key ck on keys.id = ck.key_id
            WHERE cache_id IN (
                SELECT cache_id FROm cache.keys
                    INNER JOIN cache.cache_key c on keys.id = c.key_id
                WHERE keys.hash = $1
            ) AND keys.hash != $1 AND cache_id != $2

        `, [hash, excludedCache == '' ? -1 : excludedCache]);
        return keys.rows
    }

    /*
    * Creates a new API Key with the given name, description, and cache_id.
    * @param name - The name of the key.
    * @param description - The description of the key.
    * @param cache_id - An array of cache IDs to associate the key with.
    * @param key - The key to be hashed and stored.
    * @param deleteable - Optional parameter to indicate if the key is deleteable.
    *
    * @returns The ID of the created key.
    * @throws Error if there is an error creating the key or if the key already exists.
    * */
    public async createKey(name:string, description:string, cache_id:Array<number>, key:string, deleteable?:boolean){
        const hash = this.getHashedKey(key);
        const keyResult = await this.client.query(`
            INSERT INTO cache.keys (name, description, hash)
            VALUES($1, $2, $3)
                RETURNING *;
        `, [name, description, hash]);

        if(!keyResult.rows || keyResult.rows.length === 0){
            throw new Error("Error creating key")
        }

        const keyId = keyResult.rows[0].id;
        for(const cache of cache_id){
            await this.client.query(`
                INSERT INTO cache.cache_key (cache_id, key_id, permissions) VALUES($1, $2, $3)
            `, [cache, keyId, deleteable ? "managed" : "none"]);
        }
        return keyId;
    }

    public async expandKey(cache_id:string, keys:Array<string>){
        //TODO: Move this to a transaction
        for(const key of keys){
            const keyResult = await this.client.query(`
                SELECT * FROM cache.keys WHERE id = $1
            `, [key]);
            console.log(keyResult.rows)
            if(!keyResult.rows || keyResult.rows.length === 0){
                throw new Error("Error creating key")
            }
            const keyId = keyResult.rows[0].id;
            //Check if this key already exists in the cache_key table
            const check = await this.client.query(`
                SELECT * FROM cache.cache_key WHERE cache_id = $1 AND key_id = $2
            `, [cache_id, keyId]);
            console.log(check.rows);
            if(check.rows.length > 0){
                //If it exists then skip
                continue;
            }
            await this.client.query(`
                INSERT INTO cache.cache_key (cache_id, key_id) VALUES($1, $2)
            `, [cache_id, keyId]);
        }
    }

    public async removeKeyFromCache(cache_id:string, key:string){
        //Remove the combination from the cache_key table
        await this.client.query(`
            DELETE FROM cache.cache_key WHERE cache_id = $1 AND key_id = $2
        `, [cache_id, key]);

        //Check if this key is still in use
        const check = await this.client.query(`
            SELECT * FROM cache.cache_key WHERE key_id = $1
        `, [key]);

        //If it is not in use then delete the key
        if(check.rows.length === 0){
            await this.client.query(`
                DELETE FROM cache.keys WHERE id = $1
            `, [key]);
        }
    }

    public async getDerivationsForCache(cache_id:string, offset:number, apiKey:string){

        //Check if the cache_id is "all", if so we need to get all the caches this user has access too
        let caches = [cache_id]
        if(cache_id === "all"){
            caches = await this.getCachesForKey(apiKey).then((res)=>{
                console.log(res)
                return res.map((cache) => cache.id);
            });
        }
        console.log('Caches to get derivations for:', caches);
        const res = await this.client.query(`
            SELECT hashes.*, (SELECT time
                              FROM cache.request
                              WHERE request.hash = hashes.id AND request.type = 'outbound'
                                AND request.cache_id = ANY($1)
                              LIMIT 1) as last_accessed, count(r.hash) as hits FROM cache.hashes
            LEFT JOIN cache.request r on hashes.id = r.hash
                AND r.type = 'outbound'
                AND hashes.cache = ANY($1)
                AND r.cache_id = ANY($1)
            GROUP BY hashes.id
            ORDER BY hashes.cache, hashes.id
            OFFSET $2
            LIMIT 50;
        `, [caches, offset]);

        //Get count of all hashes store in that cache
        const count = await this.client.query(`
            SELECT count(*) as count FROM cache.hashes WHERE cache = ANY($1);
        `, [caches]);

        return {
            hashes: res.rows,
            totalCount: count.rows[0].count
        }
    }

    /*
    * Appends a public signing key to the database and links it to a cache and an API key.
    * It will **not create the link** if this combination of keyID, cacheID and apiKeyID already exists.
    * @param cache_id - The ID of the cache to link the signing key to.
    * @param publicSigningKey - The public signing key to append.
    * @param apiKeyID - The ID of the API key to link the signing key to.
    * @param name - The name of the public signing key.
    * @return The ID of the appended public signing key.
    * */
    public async appendPublicSigningKey(cache_id:string, publicSigningKey:string, apiKeyID:string, name:string):Promise<string>{
        //Insert the psk into the database
        const pskID = await this.client.query(`
            INSERT INTO cache.public_signing_keys (name, key, description)
            VALUES($1, $2, $3)
            RETURNING *
        `, [name, publicSigningKey, "Public Signing Key for an Iglu Builder"])

        //Connect the psk and the api key
        await this.client.query(`
            INSERT INTO cache.signing_key_cache_api_link (signing_key_id, cache_id, key_id)
            VALUES($1, $2, $3)
        `, [pskID.rows[0].id, cache_id, apiKeyID]);

        return pskID.rows[0].id;
    }

    /*
    * Checks if a given signing key has an exact match in the database and if so returns information about that key
    * @param publicSigningKey - The public signing key to check.
    * */
    public async checkPublicSigningKeyExists(publicSigningKey:string):Promise<{exists:boolean, id:number | null}>{

        //Check if the public signing key exists in the database
        const res = await this.client.query(`
            SELECT * FROM cache.public_signing_keys WHERE key = $1
        `, [publicSigningKey]);
        return {
            exists: res.rows.length > 0,
            id: res.rows.length > 0 ? res.rows[0].id : null,
        }
    }

    /*
    * This function gets all builders from the database and returns them
    * */
    public async getAllBuilders():Promise<Array<builderDatabase>>{
        const res:Array<builderDatabase> = await this.client.query(`
            SELECT row_to_json(cb.*) as builder, row_to_json(cc.*) as cachix, row_to_json(bo.*) as buildoptions, row_to_json(gc.*) as git, row_to_json(ca.*) as cache
            FROM cache.builder cb
                     INNER JOIN cache.git_configs gc ON gc.builder_id = cb.id
                     INNER JOIN cache.cachixconfigs cc ON cc.builder_id = cb.id
                     INNER JOIN cache.buildoptions bo ON bo.builder_id = cb.id
                     INNER JOIN cache.caches ca ON ca.id = cc.target
            GROUP BY cb.id, cc.id, bo.id, gc.id, ca.id;
        `).then((res)=>{
            return res.rows
        })
        return res
    }

    public async createBuilder(config:builderDatabaseRepresenation, cacheID:string):Promise<number>{
        await this.client.query(`
            START TRANSACTION; 
             `)
        let resId = await this.client.query(`
            INSERT INTO cache.builder (name, description, enabled, trigger, cron, webhookurl, cache_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `, [
            //Inserts for the builder table
            config.name,
            config.description,
            config.enabled,
            config.trigger,
            config.schedule ? config.schedule : '',
            config.webhookURL,
            cacheID,
        ])

        let id = resId.rows[0].id;

        await this.client.query(`


                INSERT INTO cache.cachixconfigs (builder_id, push, target, apikey, signingkey, buildoutputdir)
                    VALUES($1, $2, $3, $4, $5, $6);
        `, [
            //Builder ID
            id,

            //Inserts for the cachixConfigs table
            config.buildOptions.cachix.push,
            cacheID,
            config.buildOptions.cachix.apiKey,
            config.buildOptions.cachix.signingKey,
            config.buildOptions.cachix.cachixPushSourceDir,
        ])

        await this.client.query(`
            INSERT INTO cache.git_configs (builder_id, repository, branch, gitusername, gitkey, requiresauth, noclone)
            VALUES($7, $1, $2, $3, $4, $5, $6);
        `, [
            //Inserts for the git_configs table
            config.git.repository,
            config.git.branch,
            config.git.gitUsername,
            config.git.gitKey,
            config.git.requiresAuth,
            config.git.noClone,

            //Builder ID
            id
        ])

        await this.client.query(`
            INSERT INTO cache.buildoptions (builder_id, cores, maxjobs, keep_going, extraargs, parallelbuilds, command)
            VALUES($1, $2, $3, $4, $5, $6, $7);
        `, [
            id,
            //Inserts for the buildOptions table
            config.buildOptions.cores,
            config.buildOptions.maxJobs,
            config.buildOptions.keep_going,
            config.buildOptions.extraArgs,
            config.buildOptions.parellelBuilds,
            config.buildOptions.command,
        ])

        await this.client.query(`
            COMMIT TRANSACTION;
        `)
        return id;
    }

    public async createBuilderRun(builderId:number, gitCommit:string, status:string, log:string):Promise<number>{
        return await this.client.query(`
            INSERT INTO cache.builder_runs (builder_id, gitcommit, status, log, duration)
                VALUES($1, $2, $3, $4, $5)
            RETURNING id;
        `, [builderId, gitCommit, status, log, 0]).then((res)=>{
            console.log(res.rows[0])
            return res.rows[0].id;
        })
    }

    public async updateBuilderRun(builderRunID:number, status:string, log:string){
        await this.client.query(`
            UPDATE cache.builder_runs
            SET status = $1, log = $2, duration = age(now(), (SELECT started_at FROM cache.builder_runs WHERE id = $3)), ended_at = now()
            WHERE id = $3;;
        `, [status, log, builderRunID]);
    }

    public async getBuilderConfigByWebhookURL(webhookURL:string):Promise<{id:string, cache_id:string} | null>{
        const res = await this.client.query(`
            SELECT id, cache_id FROM cache.builder WHERE webhookurl = $1
        `, [webhookURL]);

        return res.rows[0]
    }

    public async getBuilderRun(runID:string):Promise<{
        id: number,
        builder_id: number,
        status: string,
        started_at: Date,
        ended_at: Date | null,
        gitcommit: string,
        duration: string,
        log: string
    }>{
        const res = await this.client.query(`
            SELECT * FROM cache.builder_runs WHERE id = $1
        `, [runID]);

        if(res.rows.length === 0){
            throw new Error("Builder run not found");
        }

        return res.rows[0];
    }

    public async getBuildersByCacheID(cacheID:string):Promise<Array<dbBuilder>>{
        const res = await this.client.query(`
            SELECT row_to_json(cb.*) as builder, row_to_json(cc.*) as cachix, row_to_json(bo.*) as buildoptions, row_to_json(gc.*) as git, row_to_json(ca.*) as cache,
                   (SELECT row_to_json(br.*) FROM cache.builder_runs br WHERE br.builder_id = cb.id ORDER BY br.started_at DESC LIMIT 1) as lastrun
            FROM cache.builder cb
                     INNER JOIN cache.git_configs gc ON gc.builder_id = cb.id
                     INNER JOIN cache.cachixconfigs cc ON cc.builder_id = cb.id
                     INNER JOIN cache.buildoptions bo ON bo.builder_id = cb.id
                     INNER JOIN cache.caches ca ON ca.id = cc.target
            WHERE ca.id = $1
            GROUP BY cb.id, cc.id, bo.id, gc.id, ca.id;
        `, [cacheID])
        return res.rows
    }

    public async getBuilderByID(id:string):Promise<builderFrontendPackage | undefined>{
        //This might as well be the most ugly query I have ever written but it works for now and if you have a better way to do this please let me know
        const res = await this.client.query(`
            SELECT row_to_json(cb.*) as builder,
                   row_to_json(cc.*) as cachix,
                   row_to_json(bo.*) as buildoptions,
                   row_to_json(gc.*) as git,
                   row_to_json(ca.*) as cache,
                   (
                       SELECT json_agg(builder) FROM (
                             SELECT json_build_object(
                                            'id', br.id,
                                            'builder_id', br.builder_id,
                                            'status', br.status,
                                            'started_at', br.started_at,
                                            'ended_at', br.ended_at,
                                            'gitcommit', br.gitcommit,
                                            'duration', br.duration) as builder
                             FROM cache.builder_runs br
                             WHERE br.builder_id = $1
                             ORDER BY br.started_at DESC
                             LIMIT 50
                         ) as c
                   ) as runs
            FROM cache.builder cb
                     INNER JOIN cache.git_configs gc ON gc.builder_id = cb.id
                     INNER JOIN cache.cachixconfigs cc ON cc.builder_id = cb.id
                     INNER JOIN cache.buildoptions bo ON bo.builder_id = cb.id
                     INNER JOIN cache.caches ca ON ca.id = cc.target
            WHERE cb.id = $1
            GROUP BY cb.id, cc.id, bo.id, gc.id, ca.id;
        `, [id])
        return res.rows[0]
    }
}