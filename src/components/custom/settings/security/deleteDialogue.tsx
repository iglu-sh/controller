import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {key} from "@/types/api";
import {X} from "lucide-react";
import {useEffect, useState} from "react";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner"
export default function DeleteDialogue({keys, keyID, cacheID, deletedKeyCallback}: {keys:key[] | null, keyID:string | null, cacheID:string | null, deletedKeyCallback: () => void}) {
    const thisKey = keys?.find((key) => key.id === keyID);
    const [open, setOpen] = useState(false);
    async function deleteKey(){
        const response = await fetch(`/api/v1/user/keys?key=${keyID}&cache=${cacheID}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('iglu-session')}`
            },
        })
        if(response.ok){
            toast.success("Key deleted");
        }
        else{
            toast.error("Error deleting key");
        }

        //Close the dialog and call the callback function
        setOpen(false);
        deletedKeyCallback();
    }
    return (
        <Dialog onOpenChange={()=>{setOpen(!open)}} open={open}>
            <DialogTrigger disabled={!keys || keys.length <= 1} asChild>
                <Button variant="destructive" disabled={!keys || keys.length <= 1 }><X /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        This will remove the key <span className="text-orange-400">{thisKey.name}</span> from this cache. This action cannot be undone.
                        If this key is used in any other cache, it will <strong>not be removed from that cache</strong>. <br />
                        <span className="text-orange-400">If this is the key you are currently using, you will be logged out of the application!</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                    <DialogClose className="w-full flex justify-center">
                        <Button variant="outline" className="w-full">
                            Hell no!
                        </Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={() => deleteKey()}>
                        Yes, delete it!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}