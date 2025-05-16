"use client"

import {Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis} from "recharts"

import {ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from "@/components/ui/chart"
import {cacheInfoObject} from "@/types/api";
import {useEffect, useState} from "react";

const chartConfig = {
    desktop: {
        label: "Inbound",
        color: "#2563eb",
    },
    mobile: {
        label: "Outbound",
        color: "#60a5fa",
    },
} satisfies ChartConfig

export default function TrafficChart({data}:{data:cacheInfoObject}) {
    const [chartData, setChartData] = useState([])
    useEffect(()=>{
        let collector:{[key:string]:{inbound:number, outbound:number, time:string}} = {}
        for(const dataEntry of data.request){
            if(!collector[dataEntry.time]){
            collector[dataEntry.time] = {
                inbound: 0,
                outbound: 0,
                time: `${new Date(dataEntry.time).getDate()} ${new Date(dataEntry.time).toLocaleString('default', { month: 'long' })}`
            };
            }
            if(dataEntry.type === "inbound"){
                collector[dataEntry.time].inbound = dataEntry.total
            }
            if(dataEntry.type === "outbound"){
                collector[dataEntry.time].outbound = dataEntry.total
            }
        }

        const keys = Object.keys(collector)
        let chartData = []
        for(const key of keys){
            chartData.push({
                time: collector[key].time,
                inbound: collector[key].inbound,
                outbound: collector[key].outbound
            })
        }
        console.log(chartData)
        setChartData(chartData)
    }, [])
    return (
        <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4 col-span-4">
            <h1>
                Traffic Overview
            </h1>
            <ChartContainer config={chartConfig} className="min-h-[100px] w-full">
                <AreaChart accessibilityLayer data={chartData}
                           margin={{
                               left: 12,
                               right: 12,
                           }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="time"
                        tickLine={true}
                        axisLine={true}
                        tickMargin={8}
                    />
                    <ChartTooltip
                        cursor = {false}
                        content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <Area
                        dataKey="inbound"
                        fill="var(--chart-1)"
                        type="natural"
                        fillOpacity={0.4}
                        stroke="var(--chart-1)"
                        radius={4} />
                    <Area

                        dataKey="outbound"
                        fill="var(--chart-2)"
                        fillOpacity={0.4}
                        stroke="var(--chart-2)"
                        type="natural"
                        radius={4} />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}
