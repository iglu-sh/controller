import {Client} from "pg";
import 'dotenv/config'
export default class Database{
    client: Client;

    constructor(){

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
        const res = await this.client.query('SELECT * FROM cache.caches WHERE key = $1', [key]);
        return res.rows;
    }
}