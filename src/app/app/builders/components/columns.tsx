import type {ColumnDef} from "@tanstack/react-table";
import type {combinedBuilder} from "@iglu-sh/types/core/db";

export const columns:ColumnDef<combinedBuilder>[] = [
    {
        accessorKey: "builder.id",
        header: "ID",
    },
    {
        accessorKey: "builder.name",
        header: "Name",
    },
    {
        accessorKey: "builder.arch",
        header: "Arch",
    },
    {
        accessorKey: "builder.id",
        cell: (id)=> {
            return <div>
                {id.getValue() as string}
            </div>
        }
    }
]