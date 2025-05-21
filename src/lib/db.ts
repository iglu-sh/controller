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
        const res = await this.client.query(`
            SELECT c.* 
            FROM cache.keys 
                INNER JOIN cache.cache_key ON keys.id = cache_key.key_id
                INNER JOIN cache.caches c ON c.id = cache_key.cache_id 
            WHERE hash = $1
        `, [hash]);
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
                     INNER JOIN cache.cache_key ON caches.id = cache_key.cache_id
                     INNER JOIN cache.keys ON cache_key.key_id = keys.id
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

        `, [hash, excludedCache]);
        return keys.rows
    }

    public async createKey(name:string, description:string, cache_id:Array<number>, key:string){
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
                INSERT INTO cache.cache_key (cache_id, key_id) VALUES($1, $2)
            `, [cache, keyId]);
        }
        return key;
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
}