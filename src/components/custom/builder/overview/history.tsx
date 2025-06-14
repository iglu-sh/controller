import {builderFrontendPackage} from "@/types/db";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {DataTable} from "@/components/custom/dataTable";
import {ColumnDef} from "@tanstack/react-table";
import {builder} from "@/types/api";
import {Button} from "@/components/ui/button";
import {Calendar, Clock, Terminal} from "lucide-react";
import {badgeColors} from "@/lib/colors";
import {Badge} from "@/components/ui/badge";
const columns:ColumnDef<builder> = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "started_at",
        header: "Started",
        cell: ({row}) => {
            const date = new Date(row.original.started_at);
            return (
                <span className="flex flex-row gap-2 items-center">
                    <Calendar  size={15}/>
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </span>
            );
        }
    },
    {
        accessorKey: "duration",
        header: "Duration",
        cell: ({row})=>{
            return (
                <span className="flex flex-row gap-2 items-center">
                    <Clock size={15} />
                    {row.original.duration}
                </span>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({row})=>{
            return(
                <Badge className={badgeColors[row.original.status.toLowerCase()] || "bg-gray-500"}>
                    {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </Badge>
            )
        }
    },
    {
        accessorKey: "",
        header: "Actions",
        cell: ({row}) => {
            return (
                <a href={`/app/builders/run/${row.original.id}`}>
                    <Button variant="outline">
                        <Terminal />
                        View Details
                    </Button>
                </a>
            )
        }
    }
]
export default function History({builder}:{builder:builderFrontendPackage}){
    return(
        <Card>
            <CardHeader>
                <h2>
                    Build History for "{builder.builder.name}"
                </h2>
                <p className="text-muted-foreground">
                    Recent builds for this configuration (up to 50 builds).<br />
                    Newest builds are shown first.
                </p>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={builder.runs ? builder.runs : []} />
            </CardContent>
        </Card>
    )
}