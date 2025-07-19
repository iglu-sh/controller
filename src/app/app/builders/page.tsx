import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

export default function Builders(){
    if(process.env.NEXT_PUBLIC_DISABLE_BUILDER === "true"){
        // If the builder is disabled, redirect to the home page
        document.location.href = "/";
    }
    return(
        <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">
                    Builders
                </h1>
                <div className="text-muted-foreground text-sm">
                    Build and manage Nix packages with ease
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="account">Overview</TabsTrigger>
                        <TabsTrigger value="password">Queue</TabsTrigger>
                        <TabsTrigger value="password">Nodes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">Make changes to your account here.</TabsContent>
                    <TabsContent value="password">Change your password here.</TabsContent>
                </Tabs>
            </div>
        </div>
    )
}