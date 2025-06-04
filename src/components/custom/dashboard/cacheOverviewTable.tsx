import {userInfoObject} from "@/types/api";
import {DataTable} from "@/components/custom/dataTable";
import {ColumnDef} from "@tanstack/react-table";

const columns: ColumnDef<Cache>[] = [
    {
        header: "",
        id: "selection",
        cell: ()=>{
            return(
                <input type="checkbox" />
            )
        }
    }
    ]
export default function CacheOverviewTable({userData}:{userData:userInfoObject}){
    return (
        <DataTable columns={columns} data={userData.caches} />
    )
}