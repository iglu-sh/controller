export type uuid = `${string}-${string}-${string}-${string}-${string}`;

export type User = {
    id: uuid;
    username: string;
    password: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    last_login: Date | null;
    is_admin: boolean;
    is_verified: boolean;
    must_change_password: boolean;
    avatar_color: string
}