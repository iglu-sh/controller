import {Client} from "pg";
import 'dotenv/config'
import {cache, cacheCreationObject} from "@/types/api";
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
        const res = await this.client.query('SELECT * FROM cache.caches WHERE $1 = all(allowedkeys)', [key]);
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
        [info.githubUsername, info.isPublic, info.name, "read", info.compression, info.publicSigningKey, [owner], process.env.NEXT_PUBLIC_CACHE_URL, info.priority])
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
}