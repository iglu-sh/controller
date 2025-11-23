import type {ColumnDef} from "@tanstack/react-table";
import type {xTheEverythingType} from "@iglu-sh/types/core/db";
import {Button} from "@/components/ui/button";

export const cachesColumns:ColumnDef<xTheEverythingType>[] = [
    {
        accessorKey: "cache.name",
        header: "Cache Name",
    },
    {
        accessorKey: "cache.api_keys",
        header: "Number of API Keys",
        cell: ({row}) => (row.original.cache.api_keys ?? []).length
    },
    {
        accessorKey: "cache.builders",
        header: "Number of Builders",
        cell: ({row}) => (row.original.cache.builders ?? []).length
    },
    {
        accessorKey: "cache.id",
        header: "Actions",
        cell: ({row}) => {
            return(
                <div className="flex flex-row gap-2">
                    <Button>
                        View Details
                    </Button>
                    <Button variant="secondary">
                        Edit Cache
                    </Button>
                    <Button variant="destructive">
                        Delete Cache
                    </Button>
                </div>
            )
        }
    }
]