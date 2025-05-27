'use client'
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Input} from "@/components/ui/input";
import {ColumnDef} from "@tanstack/react-table";
import {builder} from "@/types/api";
import {Button} from "@/components/ui/button";
import {DataTable} from "@/components/custom/dataTable";
import {useState} from "react";
import {Trash, Trash2, TrashIcon} from "lucide-react";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {DialogBody} from "next/dist/client/components/react-dev-overlay/ui/components/dialog";
type substituter = {
    "id":number,
    "url":string,
    "publickey":string,
}
export default function Options(){
    const [substituters, setSubstituters] = useState<substituter[]>([
        {
            "id": 1,
            "url": "https://cache.nixos.org",
            "publickey": "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
        }
    ]);
    const columns:ColumnDef<substituter> = [
        {
            accessorKey: "url",
            header: "URL",
        },
        {
            accessorKey: "publickey",
            header: "Public Key",
        },
        {
            accessorKey: "id",
            header: "Actions",
            cell: (row)=>{
                return(
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button disabled={row.getValue("id") === 1}>
                                <Trash2 />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    You sure?
                                </DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this substituter? You can re-add them via the form.
                                </DialogDescription>
                                <DialogBody>
                                    <DialogClose className="w-full">
                                        <div className="grid grid-cols-2 gap-4 w-full justify-between">
                                            <Button>
                                                Cancel
                                            </Button>
                                            <Button variant="destructive">
                                                <TrashIcon className="mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </DialogClose>
                                </DialogBody>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                )
            }
        }
    ]
    return(
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-3">
                <div className="flex flex-row justify-between">
                    <label>
                        Allow Unfree
                    </label>
                    <Switch />
                </div>
                <div className="flex flex-row justify-between">
                    <label>
                        Parallel Building
                    </label>
                    <Switch />
                </div>
                <div className="flex flex-row justify-between">
                    <label>
                        Sandboxed
                    </label>
                    <Switch />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="flex-col flex space-y-2">
                    <label>
                        Max Jobs
                    </label>
                    <Input defaultValue="4" />
                </div>
                <div className="flex-col flex space-y-2">
                    <label>
                        Max Jobs
                    </label>
                    <Input defaultValue="2" />
                </div>
            </div>
            <div className="flex flex-col space-y-2">
                <label>
                    Substituters
                </label>
                <div className="flex flex-col gap-2">
                    <Input type="text" placeholder="e.g https://cache.nixos.org"></Input>
                    <Input type="text" placeholder="Public Key"></Input>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button>Add Substituter</Button>
                        <Button variant="secondary">Auto-Configure one of your caches</Button>
                    </div>
                </div>
                <div className="text-muted-foreground text-sm">
                    Add multiple caches with the same URL to add multiple public keys.
                </div>
                <DataTable columns={columns} data={substituters} />
                <div className="text-muted-foreground text-sm">
                    Builds will always run with the default Nix cache (https://cache.nixos.org) unless you specify a different one here. Builds may not run without a substituter due to resource constraints.
                </div>
            </div>
        </div>
    )
}