import type {combinedBuilder} from "@iglu-sh/types/core/db";
import React, {type Dispatch} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";

export default function BuildOptionsTab({config, setConfig}:{config:combinedBuilder, setConfig: Dispatch<React.SetStateAction<combinedBuilder>>}){
    return(
        <Card>
            <CardContent>
                <CardTitle>
                    Build Options
                </CardTitle>
                <CardDescription>
                    Configure the Build Options for the Builder. These options will be used when building the project.
                </CardDescription>
                <div className="flex flex-col gap-2 mt-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                        <div>
                            <span className="font-bold">
                                Command
                            </span>
                            <div className="text-sm text-muted-foreground">
                                The command to run when building the project.
                            </div>
                            <Input onChange={(e)=>{
                                setConfig((prev) => ({
                                    ...prev,
                                    build_options: {
                                        ...prev.build_options,
                                        command: e.target.value
                                    }
                                }))
                            }}
                            aria-invalid={
                                !config.build_options.command ||
                                config.build_options.command.length < 1 ||
                                !config.build_options.command.includes('nix build') &&
                                !config.build_options.command.includes('nix-build')
                            }
                            />
                        </div>
                    </div>
                </div>
            </CardContent>

        </Card>
    )
}