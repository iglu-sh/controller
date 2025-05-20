import {Client} from "pg";
import 'dotenv/config'
import {cache, cacheCreationObject, key, userInfoObject} from "@/types/api";

export default class Database{
    client: Client;

    constructor(){
        console.log(process.env.DATABASE_URL)
        if(!process.env.DATABASE_URL){
            console.error('DATABASE_URL not set');
            process.exit(1)
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
            process.exit(1);
        });
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

    async getCachesForKey(key: string):Promise<cache[]>{
        const hash = this.getHashedKey(key);
        const res = await this.client.query('SELECT c.* FROM cache.keys INNER JOIN cache.caches c ON c.id = keys.cache_id WHERE hash = $1', [hash]);
        console.log(res.rows)
        return res.rows;
    }

    async createCache(info:cacheCreationObject, owner:string):Promise<cache>{

        //Check if the cache already exists
        const check = await this.client.query(`
            SELECT * FROM cache.caches WHERE name = $1
        `, [info.name]);
        if(check.rows.length > 0){
            throw new Error("-1")
        }

        const createdCache = await this.client.query(`
        INSERT INTO cache.caches (githubusername, ispublic, name, permission, preferredcompressionmethod, publicsigningkeys, uri, priority)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
        `,
        [info.githubUsername, info.isPublic, info.name, "Read", info.compression.toUpperCase(), info.publicSigningKey, process.env.NEXT_PUBLIC_CACHE_URL, info.priority])

        if(!createdCache.rows || createdCache.rows.length === 0){
            throw new Error("Error creating cache")
        }

        //Create the key in the keys table
        const key = this.getHashedKey(owner);
        const cacheId = createdCache.rows[0].id;
        await this.client.query(`
            INSERT INTO cache.keys (cache_id, name, description, hash, permissions)
                VALUES($1, $2, $3, $4, $5)
        `, [cacheId, "Initial Key", "The key that was used during the initial creation of the cache", key, "Read"]);
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

    async getPublicSigningKeysForKey(key:string){
        const hash = this.getHashedKey(key);
        const res = await this.client.query(`
            SELECT publicsigningkeys, caches.name 
            FROM cache.caches 
                INNER JOIN cache.keys ON caches.id = keys.cache_id
            WHERE keys.hash = $1 AND publicsigningkeys != \'\'`, [hash]);
        if(res.rows.length === 0){
            return []
        }
        return res.rows.map((row)=>{
            return {"name":row.name, "key": row.publicsigningkeys};
        });
    }

    public async getCacheById(id:string, apiKey:string){
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT caches.* FROM cache.caches 
                INNER JOIN cache.keys ON caches.id = keys.cache_id
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
                INNER JOIN cache.keys ON keys.cache_id = c.id
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
                INNER JOIN cache.keys ON keys.cache_id = c.id
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
                INNER JOIN cache.keys ON keys.cache_id = c.id
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
                INNER JOIN cache.keys ON keys.cache_id = c.id
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
                INNER JOIN cache.keys ON keys.cache_id = c.id  
            WHERE keys.hash = $1 
            GROUP BY cache ORDER BY sum(cfilesize) DESC LIMIT 10;
        `, [hash]).then((res)=>{return res.rows})
    }

    public async getHashesCountByKey(apiKey:string):Promise<number>{
        const hash = this.getHashedKey(apiKey);
        const res = await this.client.query(`
            SELECT count(*) as count FROM cache.hashes
                INNER JOIN cache.caches c on hashes.cache = c.id
                INNER JOIN cache.keys ON keys.cache_id = c.id
            WHERE keys.hash = $1;
        `, [hash]);
        return res.rows[0].count;
    }

    public async getUserInformation(apikey:string):Promise<userInfoObject>{
        const hash = this.getHashedKey(apikey);
        //Get all the caches this user has access to
        const caches = await this.client.query(`
            SELECT caches.* FROM cache.caches
                INNER JOIN cache.keys ON caches.id = keys.cache_id
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

    public async getKeysForCache(cache_id:string, apiKey:string):Promise<key[]>{
        const hash = this.getHashedKey(apiKey);
        const keys = await this.client.query(`
            SELECT id, cache_id, name, description, created_at, permissions FROM cache.keys WHERE cache_id = $1 
        `, [cache_id]);

        //If there are no keys found then the key provided is not valid
        if(keys.rows.length === 0){
            throw new Error("No keys found")
        }

        //If the key is found then return the keys
        return keys.rows;
    }

    public async getKeysForUser(apiKey:string):Promise<key[]>{
        const hash = this.getHashedKey(apiKey);
        const keys = await this.client.query(`
            SELECT id, cache_id, name, description, created_at, permissions FROM cache.keys WHERE cache_id IN (SELECT cache_id FROM cache.keys WHERE hash = $1) AND hash != $1
        `, [hash]);
        return keys.rows
    }

    public async createKey(name:string, description:string, cache_id:number, key:string){
        const hash = this.getHashedKey(key);
        await this.client.query(`
            INSERT INTO cache.keys (cache_id, name, description, hash, permissions)
            VALUES($1, $2, $3, $4, $5)
        `, [cache_id, name, description, hash, "Read"]);

        return key;
    }
}