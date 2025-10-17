import type {ColumnDef} from "@tanstack/react-table";
import type {builder, combinedBuilder} from "@iglu-sh/types/core/db";
import {Button} from "@/components/ui/button";
import Link from "next/link";

export const columns:ColumnDef<builder>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "arch",
        header: "Arch",
    },
    {
        accessorKey: "id",
        header: "Actions",
        cell: ({row}) => {
            return <div>
                <Link href={row.original.webhookURL ?? `none`} aria-disabled={!row.original.webhookURL}><Button variant="default" id={`trigger-btn-${row.original.id}`}>Trigger Build</Button></Link>
                <Link href={`/app/builders/edit/${row.original.id}`}><Button variant="secondary" id={`edit-btn-${row.original.id}`} className="ml-2">Details</Button></Link>
                <Button variant="destructive" id={`delete-btn-${row.original.id}`} className="ml-2">Delete</Button>
            </div>
        }
    }
]