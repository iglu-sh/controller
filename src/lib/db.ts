import {Client} from "pg";
import Logger from "@iglu-sh/logger";
import type {User} from "@/types/db";
import bcrypt from "bcryptjs";
export default class Database{
    private client: Client
    constructor() {
        this.client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || "5432", 10),
        })
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
                    reject(err);
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
                    reject(err);
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
            )
        `)

        // Modifies the existing cache tables to include a userID
        // User ID may be null if the cache is not owned by a user (yet)
        await this.client.query(`
            ALTER TABLE cache.caches ADD COLUMN IF NOT EXISTS user_id uuid NULL CONSTRAINT cache_user_fk REFERENCES cache.users(id) ON DELETE CASCADE;
            ALTER TABLE cache.builder ADD COLUMN IF NOT EXISTS user_id uuid NULL CONSTRAINT builder_user_fk REFERENCES cache.users(id) ON DELETE CASCADE;
            ALTER TABLE cache.keys ADD COLUMN IF NOT EXISTS user_id uuid NULL CONSTRAINT keys_user_fk REFERENCES cache.users(id) ON DELETE CASCADE;
        `)
        Logger.debug('Database tables set up successfully');

        // Check if the user table is empty, if so we create a default admin user with the password "admin" and username "admin"
        const res = await this.client.query('SELECT COUNT(*) FROM cache.users');
        if(res.rows[0].count > 0){
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
    public async getCacheByUserID(userID:string){

    }

    public async createUser(username:string, email:string, password:string, is_admin:boolean, is_verified:boolean, must_change_password:boolean, show_setup:boolean = false):Promise<User>{
        let hashedPW = await this.hashPW(password)
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

    public async authenticateUser(username:string, password:string):Promise<User | null>{
        Logger.info(`Authenticating user ${username}`);
        let hashedPW = await this.hashPW(password)
        let user = await this.client.query(`
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
        let isValid = await this.verifyPassword(password, user.password);
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
        Logger.info("Disconnected from DB");
    }
}