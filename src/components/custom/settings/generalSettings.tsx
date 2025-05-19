import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";

export default function GeneralSettings(){
    return(
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic cache settings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cache-name">Cache Name</Label>
                    <Input id="cache-name" placeholder="Cache Name"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cache-description">Description</Label>
                    <Textarea
                        id="cache-description"
                        rows={3}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="log-level">Log Level</Label>
                    <Select >
                        <SelectTrigger id="log-level">
                            <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="debug">Debug</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    )
}