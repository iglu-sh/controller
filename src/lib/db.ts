import {Client} from "pg";
import 'dotenv/config'
import {cache, cacheCreationObject, userInfoObject} from "@/types/api";

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


    async close(){
        await this.client.end();
    }

    async getCachesForKey(key: string):Promise<{
        id: number,
        name: string,
        ispublic: boolean
    }[]>{
        const hasher = new Bun.CryptoHasher("sha512");
        hasher.update(key);
        const hash = hasher.digest('hex');
        console.log(hash)
        const res = await this.client.query('SELECT c.id, c.name, c.isPublic FROM cache.keys INNER JOIN cache.caches c ON c.id = keys.cache_id WHERE hash = $1', [hash]);
        console.log(res.rows)
        return res.rows;
    }

    async createCache(info:cacheCreationObject, owner:string):Promise<cache>{
        //Check if the cache already exists
        const check = await this.client.query('SELECT * FROM cache.caches WHERE name = $1', [info.name]);
        if(check.rows.length > 0){
            throw new Error("-1")
        }

        return await this.client.query(`
        INSERT INTO cache.caches (githubusername, ispublic, name, permission, preferredcompressionmethod, publicsigningkeys, allowedkeys, uri, priority)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
        `,
        [info.githubUsername, info.isPublic, info.name, "Read", info.compression.toUpperCase(), info.publicSigningKey, [owner], process.env.NEXT_PUBLIC_CACHE_URL, info.priority])
    }

    async getPublicSigningKeysForKey(key:string){
        const res = await this.client.query('SELECT publicsigningkeys, name FROM cache.caches WHERE $1 = any(allowedkeys) AND publicsigningkeys != \'\'', [key]);
        if(res.rows.length === 0){
            return []
        }
        return res.rows.map((row)=>{
            return {"name":row.name, "key": row.publicsigningkeys};
        });
    }

    public async getCacheById(id:string, apiKey:string){
        const res = await this.client.query('SELECT * FROM cache.caches WHERE id = $1 AND $2 = any(allowedkeys)', [id, apiKey]);
        if(res.rows.length === 0){
            throw new Error("Cache not found")
        }
        return res.rows[0];
    }

    public async getStorageStats(id:string, apiKey:string){
        const res = await this.client.query(`
            SELECT sum(cfilesize) as total_size, count(*) as store_hashes
            FROM cache.hashes
                     INNER JOIN cache.caches c on hashes.cache = c.id
            WHERE cache = $1
              AND $2= any(c.allowedkeys);
        `, [id, apiKey]);
        return {
            storageUsed: res.rows[0].total_size,
            storeHashes: res.rows[0].store_hashes
        };
    }
    public async getTrafficStats(id:string, apiKey:string){
        const res = await this.client.query(`
            SELECT date_bin('1 day', request.time, '2025-05-01') as time,
                   count(*) as Total, request.type
            FROM cache.request
                INNER JOIN cache.caches c on request.cache_id = c.id
            WHERE request.cache_id = $1
              AND $2 = any(c.allowedkeys)
              AND request.time > now() - INTERVAL '30 days'
            GROUP BY 1, request.type
            ORDER BY time;
        `, [id, apiKey]);
        return res.rows
    }

    public async getNewestAddedHashes(id:string, apiKey:string){
        const res = await this.client.query(`
            SELECT hashes.* FROM cache.hashes
                INNER JOIN cache.caches c on hashes.cache = c.id
            WHERE cache = $1
              AND $2 = any(allowedkeys)
            ORDER BY updatedat DESC
            LIMIT 10;
        `, [id, apiKey]);
        return res.rows
    }

    public async getTopRequestedHashes(id:string, apiKey:string){
        const res = await this.client.query(`
            SELECT hash, h.*, count(*) as total
            FROM cache.request
                INNER JOIN cache.caches c on request.cache_id = c.id
                INNER JOIN cache.hashes h on request.hash = h.id
            WHERE request.cache_id IN (SELECT id FROM cache.caches WHERE $1 = any(allowedkeys))
                AND request.type = 'outbound'
            GROUP BY hash, h.id
            ORDER BY total DESC
            LIMIT 10;
        `, [apiKey]);
        return res.rows
    }

    public async getTopCaches(apikey:string):Promise<{cache:number, sum:number}[]>{
        return await this.client.query(`
            SELECT cache, sum(cfilesize) as size FROM cache.hashes
                  INNER JOIN cache.caches c on hashes.cache = c.id
            WHERE $1 = any(allowedkeys)
            GROUP BY cache ORDER BY sum(cfilesize) DESC LIMIT 10;
        `, [apikey]).then((res)=>{return res.rows})
    }

    public async getHashesCountByKey(apiKey:string):Promise<number>{
        const res = await this.client.query(`
            SELECT count(*) as count FROM cache.hashes
                  INNER JOIN cache.caches c on hashes.cache = c.id
            WHERE $1 = any(allowedkeys);
        `, [apiKey]);
        return res.rows[0].count;
    }

    public async getUserInformation(apikey:string):Promise<userInfoObject>{
        const hash = await Bun.password.hash(apikey);
        console.log(hash)
        //Get all the caches this user has access to
        const caches = await this.client.query('SELECT * FROM cache.caches WHERE $1 = any(allowedkeys)', [apikey]);
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
}