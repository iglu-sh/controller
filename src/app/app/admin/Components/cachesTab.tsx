import type {xTheEverythingType} from "@iglu-sh/types/core/db";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/custom/DataTable";
import {cachesColumns} from "@/app/app/admin/Components/columns";

export default function CachesTab({everything}:{everything:xTheEverythingType[]}){
    return(
        <Card className="flex flex-col gap-4">
            <CardHeader>
                <CardTitle className="text-xl font-bold">
                    Caches
                </CardTitle>
                <CardDescription>
                    Manage your caches here. Total caches: {everything.length}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={cachesColumns} data={everything} />
            </CardContent>
        </Card>
    )
}