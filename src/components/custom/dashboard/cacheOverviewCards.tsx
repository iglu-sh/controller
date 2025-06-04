import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ArrowDown, ArrowUp, Clock, Download, HardDrive, Package} from "lucide-react";
import './cacheOverviewCards.css'
//TODO Add Logic here to make this responsive and dynamic with the data
export default function CacheOverview(){
    return(
        <div className="space-y-6 mt-3">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 ">
                <Card className="card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,583</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-green-500 flex items-center">
                            <ArrowUp className="mr-1 h-3 w-3" />
                            +156 today
                          </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1.2 TB</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-amber-500 flex items-center">
                            <ArrowUp className="mr-1 h-3 w-3" />
                            +2.3 GB today
                          </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cache Hits</CardTitle>
                        <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">87.4%</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-green-500 flex items-center">
                            <ArrowUp className="mr-1 h-3 w-3" />
                            +2.1% this week
                          </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">124 ms</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-green-500 flex items-center">
                            <ArrowDown className="mr-1 h-3 w-3" />
                            -12 ms this week
                          </span>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}