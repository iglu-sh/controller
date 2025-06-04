import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ArrowLeft, Save} from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import General from "@/components/custom/builder/create/general";
import Options from "@/components/custom/builder/create/options";
import Cachix from "@/components/custom/builder/create/cachix";

export default function CreateBuilderPage() {
    return (
        <div>
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/app">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/app/builders">Builder</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Create</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-row items-center gap-2">
                        <h1>Create New Configuration</h1>
                    </CardTitle>
                    <CardDescription>
                        Configure a new Nix build configuration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="cachix">Cachix</TabsTrigger>
                            <TabsTrigger value="options">Build Options</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general"><General /></TabsContent>
                        <TabsContent value="cachix"><Cachix /></TabsContent>
                        <TabsContent value="options"><Options /></TabsContent>
                    </Tabs>
                    <div className="flex flex-row justify-between mt-4">
                        <Button variant="outline">
                            Cancel
                        </Button>
                        <Button>
                            <Save />
                            Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}