import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {Button} from "@/components/ui/button";
import {SaveIcon} from "lucide-react";
import GeneralSettings from "@/components/custom/settings/generalSettings";
import StorageSettings from "@/components/custom/settings/storageSettings";
import SecuritySettings from "@/components/custom/settings/securitySettings";

export default function Settings(){
    return(
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <h1>
                    Settings
                </h1>
                <div className="flex w-full items-end justify-end">
                    <Button>
                        <SaveIcon />
                        Save Changes
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="storage">Storage</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>
                <TabsContent value="general"><GeneralSettings /></TabsContent>
                <TabsContent value="storage"><StorageSettings /></TabsContent>
                <TabsContent value="network">Nothing here yet :D</TabsContent>
                <TabsContent value="security"><SecuritySettings /></TabsContent>
                <TabsContent value="maintenance">Change your password here.</TabsContent>
            </Tabs>

        </div>
    )
}