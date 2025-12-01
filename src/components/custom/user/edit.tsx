import {Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import type {cache, keys, public_signing_keys, User} from "@iglu-sh/types/core/db";
import type {signing_key_cache_api_link} from "@/types/db";
import {Card} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {api} from "@/trpc/react";
import {toast} from "sonner";

export default function EditUser({
    userData
                                 }:{
    userData: {
        user: User;
        caches: cache[];
        apikeys: keys[];
        signing_keys: {
            public_signing_key: public_signing_keys[];
            signing_key_cache_api_link: signing_key_cache_api_link[]
        }
    }
}){
    const modifyUserKeyLinks = api.user.modifyUserApiKeyLink.useMutation(
        {
            onSuccess: ()=>{
                toast.success("Successfully modified user API key links!");
            },
            onError: (e)=>{
                toast.error(`Failed to modify user API key links: ${e.message}`);
            }
        }
    )
    const cleanedApiKeys:{
        apiKey: keys;
        signingkeys: public_signing_keys[];
        callback: (key: string, action: ("delete" | "removeFromUser"), target: ("apiKey" | "signingKey"), signingKey?: string) => void
    }[] = userData.apikeys.map(key => {
        const matchingSigningKeys = userData.signing_keys.public_signing_key.filter((psk)=>{
            return userData.signing_keys.signing_key_cache_api_link.some((link: { key_id: number; }) => link.key_id === key.id);
        })
        return {
            apiKey: key,
            signingkeys: matchingSigningKeys ?? [],
            callback: (key:string, action:"delete" | "removeFromUser", target: "apiKey" | "signingKey", signingKey?:string) => {
                if(target === "apiKey"){
                    modifyUserKeyLinks.mutate({
                        action: action,
                        keyID: key,
                        userID: userData.user.id
                    })
                }
            }
        }
    })

    return(
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary">
                    Edit User
                </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>
                        Edit User
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                    <Label>Username*</Label>
                    <Input defaultValue={userData.user.username} type="text" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Email*</Label>
                    <Input defaultValue={userData.user.email} type="email" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Api Keys</Label>
                    {
                        cleanedApiKeys.map((key)=>{
                            return(
                                <div key={key.apiKey.id}>
                                    {key.apiKey.name}
                                </div>
                            )
                        })
                    }
                </div>
                {/* Form fields for editing user details would go here */}
                <div className="flex flex-row justify-end gap-2 w-full">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button>
                        Confirm changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}