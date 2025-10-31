import {api} from "@/trpc/react";
import {queueColumns} from "@/app/app/builders/components/columns";
import {DataTable} from "@/components/custom/DataTable";

export default function Queue({cacheID}: {cacheID: number}) {
    // Get the current queue
    const queue = api.builder.getQueue.useQuery({id: cacheID})
    return <div>
        <DataTable columns={queueColumns} data={queue.data ?? []} />
    </div>
}