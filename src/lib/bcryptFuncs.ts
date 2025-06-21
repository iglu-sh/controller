import bcrypt from "bcryptjs";

export function bcryptHash(password: string): Promise<string> {
    // Placeholder for bcrypt hashing function
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
