import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import type {cache, keys} from "@/types/db";

export default function ReviewDeploy({cacheToCreate, selectedApiKeys}:{cacheToCreate: cache, selectedApiKeys: keys[]}) {
    return(
        <Card>
            <CardHeader>
                <CardTitle>Review & Deploy</CardTitle>
                <CardDescription>Review your settings and then deploy</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">

                <Button>Deploy</Button>
            </CardContent>
        </Card>
    )
}