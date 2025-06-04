'use client'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {useState} from "react";
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";

export default function Cachix(){
    const [mode, setMode] = useState("auto");
    return(
        <div className="flex flex-col mt-3 gap-4 w-full">
            <div className="flex flex-col space-y-2">
                <label>
                    Configuration Mode
                </label>
                <RadioGroup defaultValue="auto" className="flex flex-col" onValueChange={(value)=>{setMode(value)}}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="auto" />
                        <label htmlFor="auto">Auto-create configuration - Let the Builder handle Cachix setup auto-magically</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <label htmlFor="manual">Manual Configuration - Specify all Cachix settings manually</label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex flex-col space-y-2">
                <label>
                    Cache
                </label>
                <Select required>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select configuration type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="nix">cache1</SelectItem>
                        <SelectItem value="flake">cache2</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {
                mode == "manual" ? (
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-col space-y-2">
                            <label>
                                Cachix Signing Key
                            </label>
                            <Input type="text" />
                            <div className="text-muted-foreground text-sm">
                                This key is obtained by running cachix generate-keypair *cache-name* in your terminal.
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label>
                                Cachix API Key
                            </label>
                            <Input type="text" />
                            <div className="text-muted-foreground text-sm">
                                This key is obtained by going to your cache settings <a href="/app/settings" className="text-green-500">here</a>
                            </div>
                        </div>
                    </div>
                ) : null
            }
            <div className="flex flex-row items-center justify-between">
                <label>
                    <div className="font-medium">
                        Auto Push
                    </div>
                    <div className="text-muted-foreground text-sm">
                        Automatically push successful builds to the cache. If this is disabled, builds will only report their results without pushing to the cache.
                    </div>
                </label>
                <Switch defaultChecked={true}></Switch>
            </div>
            {
                mode == "auto" ? (

                <div className="border-blue-500 rounded-md p-4 border space-y-2">
                    <h3 className="font-medium">
                        Auto-create Mode
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        When auto-create is enabled, the service will automatically:
                    </p>
                    <ul className="text-sm space-y-1">
                        <li>• Configure the necessary authentication</li>
                        <li>• Set up the signing key for package verification</li>
                    </ul>
                    <div className="text-orange-400 text-sm">
                        Careful! This mode will create a new Cachix public key for this configuration, which you will need to add to your configurations to not receive errors!
                    </div>
                </div>
                ) : null
            }
        </div>
    )
}