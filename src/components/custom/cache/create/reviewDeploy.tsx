import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import type {cache, keys} from "@/types/db";

export default function ReviewDeploy({cacheToCreate}:{cacheToCreate: cache}) {
    return(
        <Card>
            <CardHeader>
                <CardTitle>Review & Deploy</CardTitle>
                <CardDescription>Review your settings and then deploy</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col">
                            <div>
                                Name: {cacheToCreate.name.length > 0 ? cacheToCreate.name : <span className="text-red-500">Not Set!</span>}
                            </div>
                            <div>
                                Description: N/A
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                    </CardHeader>
                    <CardContent>

                    </CardContent>
                </Card>
                <Button>Deploy</Button>
            </CardContent>
        </Card>
    )
}