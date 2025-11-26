import type {cache, keys, public_signing_keys, User} from "@iglu-sh/types/core/db";
import type {signing_key_cache_api_link} from "@/types/db";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/custom/DataTable";
import {userColumns} from "@/app/app/admin/Components/columns";
import {Button} from "@/components/ui/button";

export default function UsersTab({users}:{users:Array<{
    user: User;
    caches: cache[];
    apikeys: keys[];
    signingkeys: Array<{
        public_signing_key: public_signing_keys[];
        signing_key_cache_api_link: signing_key_cache_api_link[]
    }>
}>}){
    return (
        <Card>
            <CardHeader className="flex flex-row gap-2 justify-between">
                <div className="flex flex-col gap-2">
                    <CardTitle className="text-xl font-bold">
                        Users
                    </CardTitle>
                    <CardDescription>
                        Manage your users here. Total Users: {users.length}
                    </CardDescription>
                </div>
                <Button>
                    Add New User
                </Button>
            </CardHeader>
            <CardContent>
                <DataTable columns={userColumns} data={users} />
            </CardContent>
        </Card>
    )
}