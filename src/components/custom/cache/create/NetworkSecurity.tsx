import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Network} from "lucide-react";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";

export default function NetworkSecurity(){
    return(
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row items-center gap-2">
                    <Network />
                    <h2 className="text-2xl font-bold flex flex-row items-center gap-2">
                        Network & Security
                    </h2>
                </CardTitle>
                <CardDescription>
                    SSL and access controls
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label>URL</label>
                    <div className="text-sm text-muted-foreground font-mono p-1 bg-muted rounded">
                        {`${process.env.NEXT_PUBLIC_CACHE_URL}/name_of_cache`}
                    </div>
                </div>
                <div className="col-span-2 flex flex-row justify-between">
                    <div className="flex flex-col">
                        <strong>Enable SSL/TLS</strong>
                        <div className="text-muted-foreground text-sm">
                            Secure connections with HTTPS
                        </div>
                    </div>
                    <Switch disabled />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                    <strong>Allowed IP Ranges (optional)</strong>
                    <Textarea placeholder="10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, etc." />
                    <div className="text-sm text-muted-foreground">
                        Leave empty to allow all IPs, Use CIDR notation for IP ranges and separate them with commas.
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}