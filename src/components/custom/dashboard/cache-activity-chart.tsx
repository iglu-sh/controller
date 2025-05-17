"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function CacheActivityChart() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Sample data for the chart
    const data = [
        { hour: "00:00", hits: 342, misses: 41 },
        { hour: "02:00", hits: 245, misses: 32 },
        { hour: "04:00", hits: 187, misses: 25 },
        { hour: "06:00", hits: 156, misses: 19 },
        { hour: "08:00", hits: 432, misses: 48 },
        { hour: "10:00", hits: 687, misses: 65 },
        { hour: "12:00", hits: 823, misses: 78 },
        { hour: "14:00", hits: 756, misses: 71 },
        { hour: "16:00", hits: 812, misses: 76 },
        { hour: "18:00", hits: 635, misses: 62 },
        { hour: "20:00", hits: 524, misses: 53 },
        { hour: "22:00", hits: 398, misses: 45 },
    ]

    if (!mounted) {
        return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>
    }

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip
                        //Change the tooltip to have another background color
                        contentStyle={{ backgroundColor: "var(--accent)"}}
                    />
                    <Line type="monotone" dataKey="hits" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="misses" stroke="#f43f5e" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}