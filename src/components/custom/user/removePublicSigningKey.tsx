'use client'
import {
    AlertDialog, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {Button} from "@/components/ui/button";

export default function RemovePublicSigningKey({publicSigningKeyId, apiKeyId}:{publicSigningKeyId:string, apiKeyId:string}){

    return(
        <AlertDialog>
            <AlertDialogTrigger>
                <Button variant="destructive">
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Delete Public Signing Key
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete the public signing key from the system. It will no longer be available for signing packages, however signed packages will remain in the cache until they reach their expiration date.<br/>
                        <strong>
                            The API Key associated with this public signing key will not be deleted!
                        </strong> <br />
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-row gap-4 w-full">
                    <AlertDialogCancel asChild>
                        <Button variant="secondary">
                            Cancel
                        </Button>
                    </AlertDialogCancel>
                    <Button variant="destructive">
                        Do it!
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}