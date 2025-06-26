import {Client} from "pg";
import Logger from "@iglu-sh/logger";
import type {cache, User, xTheEverythingType} from "@/types/db";
import bcrypt from "bcryptjs";
export default class Database{
    private client: Client
    private timeout: NodeJS.Timeout = setTimeout(()=>{void this.wrap(this)}, 2000)

    constructor() {
        this.client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT ?? "5432", 10),
        })
    }
    private async wrap(cl: Database){
        await cl.disconnect()
    }
    public async connect():Promise<void>{
        Logger.info("Connecting to DB...");
        await this.client.connect()
        Logger.info("Connected to DB");
    }
    private hashPW(password:string):Promise<string>{
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err || !hash) {
                    reject(err ?? new Error("Hashing failed"));
                } else {
                    resolve(hash);
                }
            });
        });
    }
    private verifyPassword(password:string, hash:string):Promise<boolean>{
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, hash, (err, res) => {
                if (err || res === undefined) {
                    reject(err ?? new Error("Password verification failed"));
                } else {
                    resolve(res);
                }
            });
        });
    }
    public async setupDB():Promise<void>{
        // Sets up all the necessary tables for the application
        Logger.debug('Setting up database tables');

        // Sets up the required frontend tables
        await this.client.query(`
            START TRANSACTION;
            CREATE TABLE IF NOT EXISTS cache.users (
                id uuid NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
                username TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at timestamp NOT NULL DEFAULT now(),
                updated_at timestamp NOT NULL DEFAULT now(),
                last_login timestamp,
                is_admin BOOLEAN NOT NULL DEFAULT false,
                is_verified BOOLEAN NOT NULL DEFAULT false,
                must_change_password BOOLEAN NOT NULL DEFAULT false,
                -- determines if the oob experience should be shown to the user (i.e the setup screen)
                show_oob BOOLEAN NOT NULL DEFAULT false,
                avatar_color TEXT NOT NULL DEFAULT '#' || substring(md5(random()::text) FROM 3 FOR 6)
            );
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
                substituters JSONB[] NOT NULL,
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
            );
            create table if not exists cache.builder_user_link
                (
                id serial constraint builder_user_link_pk primary key,
                builder_id int constraint builder_fk references cache.builder ON DELETE CASCADE,
                user_id uuid constraint user_fk references cache.users ON DELETE CASCADE
            );
            create table if not exists cache.cache_user_link
                (
                id serial constraint cache_user_link_pk primary key,
                cache_id int constraint cache_fk references cache.caches ON DELETE CASCADE,
                user_id uuid constraint user_fk references cache.users ON DELETE CASCADE
            );
                COMMIT TRANSACTION;
        `)

        // Modifies the existing cache tables to include a userID
        // User ID may be null if the cache is not owned by a user (yet)
        await this.client.query(`
            ALTER TABLE cache.keys ADD COLUMN IF NOT EXISTS user_id uuid NULL CONSTRAINT keys_user_fk REFERENCES cache.users(id) ON DELETE CASCADE;
        `)
        Logger.debug('Database tables set up successfully');

        // Check if the user table is empty, if so we create a default admin user with the password "admin" and username "admin"
        const res = await this.client.query('SELECT COUNT(*) FROM cache.users');
        //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if(res.rows?.[0]?.count > 0){
            return
        }
        Logger.debug('No users found, creating default admin user');
        // Create a default admin user
        await this.createUser(
            "admin", // username
            "admin@admin.com", // default email
            "admin", // default password
            true, // is_admin
            true, // is_verified
            true, // must_change_password
            true // show_setup
        )
    }
    public async getUserByNameOrEmail(username:string, email:string):Promise<User | null>{
        return await this.client.query(`
            SELECT * FROM cache.users WHERE username = $1 OR email = $2
        `, [username, email])
            .then((res)=>{
                if(res.rows.length === 0){
                    return null;
                }
                return res.rows[0] as User;
            })
            .catch((err)=>{
                Logger.error(`Failed to get user by name ${username} ${err}`);
                return null;
            })
    }
    public async createUser(username:string, email:string, password:string, is_admin:boolean, is_verified:boolean, must_change_password:boolean, show_setup = false):Promise<User>{
        const hashedPW = await this.hashPW(password)
        return await this.client.query(`
            INSERT INTO cache.users (username, email, password, created_at, updated_at, last_login, is_admin, is_verified, must_change_password, show_oob)
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)    
            RETURNING *
        `, [
            username,
            email,
            hashedPW,
            new Date(),
            new Date(),
            null,
            is_admin,
            is_verified,
            must_change_password,
            show_setup
        ]).then((res)=>{
            if(res.rows.length === 0){
                throw new Error("Failed to create user");
            }
            return res.rows[0] as User;
        })
    }
    public async resetPassword(userID: string, password:string){
        Logger.debug(`Resetting password for user ${userID}`);
        const hashedPW = await this.hashPW(password);
        return await this.client.query(`
            UPDATE cache.users SET password = $1, updated_at = $2, must_change_password = false WHERE id = $3
        `, [hashedPW, new Date(), userID])
            .then((res)=>{
                if(res.rowCount === 0){
                    throw new Error("Failed to reset password");
                }
                Logger.debug(`Password for user ${userID} reset successfully`);
                return true;
            })
            .catch((err)=>{
                Logger.error(`Failed to reset password for user ${userID} ${err}`);
                throw err;
            })
    }

    public async authenticateUser(username:string, password:string):Promise<User | null>{
        Logger.info(`Authenticating user ${username}`);
        const user = await this.client.query(`
            SELECT * FROM cache.users WHERE username = $1 
        `, [username]).then((res)=>{
            return res.rows[0] as User;
        }).catch((err)=>{
            Logger.error(`Failed to authenticate user ${err}`);
            return null;
        })
        if(!user){
            Logger.error(`User ${username} not found`);
            return null;
        }
        Logger.info(`User ${username} found, verifying password`);
        const isValid = await this.verifyPassword(password, user.password);
        if(!isValid){
            Logger.error(`Invalid password for user ${username}`);
            return null;
        }
        Logger.info(`User ${username} authenticated successfully`);

        // Update last login time
        await this.client.query(`
            UPDATE cache.users SET last_login = $1 WHERE id = $2
        `, [new Date(), user.id]);
        return user;
    }
    public async disconnect():Promise<void>{
        Logger.info("Disconnecting from DB...");
        await this.client.end().catch(err => {
            Logger.error(`Failed to disconnect from DB ${err}`);
        });
        this.timeout.close()
        Logger.info("Disconnected from DB");
    }


    public async getUserById(userId:string):Promise<User | null>{
        Logger.debug(`Getting user ${userId}`);
        return await this.client.query(`
            SELECT * FROM cache.users WHERE id = $1;
        `, [userId])
            .then((res)=>{
                if(res.rows.length === 0){
                    return null;
                }
                return res.rows[0] as User;
            })
            .catch((err)=>{
                Logger.error(`Failed to get user ${userId} ${err}`);
                return null;
            })
    }

    public async getEverything():Promise<Array<xTheEverythingType>>{
        return await this.client.query(`
            SELECT row_to_json(ca.*) as cache,
                   (
                       SELECT json_agg(
                                      json_build_object(
                                              'builder', row_to_json(b.*),
                                              'options', row_to_json(bo.*),
                                              'cachix_config', row_to_json(cc.*),
                                              'git_config', row_to_json(gc.*),
                                              'runs', (
                                                  SELECT json_agg(br.*) FROM cache.builder_runs as br WHERE builder_id = b.id
                                              )
                                      )
                              )
                       FROM cache.builder as b
                                INNER JOIN cache.buildoptions as bo ON b.id = bo.builder_id
                                INNER JOIN cache.cachixconfigs as cc ON b.id = cc.builder_id
                                INNER JOIN cache.git_configs as gc ON b.id = gc.builder_id
                       GROUP BY b.cache_id
                   ) as builders,
                   (
                       SELECT json_agg(
                                      json_build_object(
                                              'key', row_to_json(psk.*),
                                              'link_record', row_to_json(skcal.*)
                                      )
                              )
                       FROM cache.public_signing_keys psk
                                INNER JOIN cache.signing_key_cache_api_link skcal ON skcal.key_id = psk.id
                       WHERE skcal.cache_id = ca.id
                       GROUP BY skcal.cache_id
                   ) as public_signing_keys,
                   (
                       SELECT json_agg(row_to_json(k.*)) FROM cache.keys k
                                                                   INNER JOIN cache.cache_key ck ON k.id = ck.key_id
                       WHERE ck.cache_id = ca.id
                       GROUP BY ck.cache_id
                   ) as api_keys,
                   (
                       SELECT json_build_object('count', count(ca.*), 'size',sum(ha.cfilesize)) FROM cache.hashes ha WHERE ha.cache = ca.id
                   ) as derivations
                   
            FROM cache.caches as ca
            GROUP BY ca.id
        `).then((res)=>{
            return res.rows as xTheEverythingType[];
        }).catch((err)=>{
            Logger.error(`Failed to get everything for admin from DB ${err}`);
            throw err;
        })
    }

    public async addUserToCache(cacheId:number, userId:string):Promise<boolean>{
        return await this.client.query(`
            INSERT INTO cache.cache_user_link (cache_id, user_id)
            VALUES ($1, $2)
        `, [cacheId, userId])
            .then(()=>{
                return true
            })
            .catch((err)=>{
                Logger.error(`Failed to add user ${userId} to cache ${cacheId} ${err}`);
                return false
            });
    }

    public async removeOOBFlag(userId:string):Promise<boolean>{
        return await this.client.query(`
            UPDATE cache.users SET show_oob = false WHERE id = $1
        `, [userId])
            .then((res)=>{
                if(res.rowCount === 0){
                    return false;
                }
                return true;
            })
            .catch((err)=>{
                Logger.error(`Failed to remove OOB flag for user ${userId} ${err}`);
                return false;
            });
    }

    public async getCachesByUserId(userId:string):Promise<Array<cache>>{
        return await this.client.query(`
            SELECT DISTINCT ca.* FROM cache.caches as ca
                INNER JOIN cache.cache_user_link as cul ON ca.id = cul.cache_id
        `).then((res)=>{
            return res.rows as cache[]
        }).catch((err)=>{
            Logger.error(`Failed to get caches for user ${userId} ${err}`);
            return [];
        })
    }

    public async addUserToApiKey(apiKeyId:number, userId:string):Promise<boolean>{
        return await this.client.query(`
            UPDATE cache.keys SET user_id = $1 WHERE id = $2
        `, [userId, apiKeyId])
            .then(()=>{
                return true;
            })
            .catch((err)=>{
                Logger.error(`Failed to add user ${userId} to API key ${apiKeyId} ${err}`);
                return false;
            });
    }
}