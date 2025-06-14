'use client'
import React, {useEffect} from 'react';
import {useParams} from "next/navigation";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";
import {Card, CardContent} from "@/components/ui/card";
import {ArrowLeft, Calendar, Clock, Search} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
export default function Page(){

    const {id} = useParams()
    const [builderOutput, setBuilderOutput] = React.useState<string[]>([]);
    const [output, setOutput] = React.useState<string[]>([]);
    const [errorCount, setErrorCount] = React.useState<number>(0);
    const [startMessage, setStartMessage] = React.useState<object | null>(null);
    const [finalMessage, setFinalMessage] = React.useState<object | null>(null);
    const [duration, setDuration] = React.useState<string | null>(null);
    const badgeColors = {
        queued: "bg-gray-300 text-gray-800",
        running: "bg-blue-300 text-blue-800",
        success: "bg-green-300 text-green-800",
        failed: "bg-red-300 text-red-800",
        cancelled: "bg-yellow-300 text-yellow-800",
        unknown: "bg-gray-300 text-gray-800"
    }
    const textColors = {
        'ERROR': 'text-red-500',
        'WARNING': 'text-yellow-500',
        'STDOUT': ''
    }
    useEffect(()=>{
        //Connect to the builder run streaming endpoint
        const apiKey = getCookie('iglu-session')
        if(!apiKey){
            console.error("No API key found")
            window.location.href = "/"
        }
        async function wrap(){
            const response = await fetch(`/api/v1/builder/${id}/listen`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                }
            }).finally(()=>{
                toast.error("WS Closed")
            })

            if(!response.ok){
                toast.error('Error fetching builder run data. Please try again later.')
                return
            }
            //Listen to the stream of the builder run
            const reader = response.body?.getReader();
            if(!reader){
                toast.error('Error fetching builder run data. Please try again later.')
                return
            }
            const decoder = new TextDecoder("utf-8");
            let done = false;
            while (!done) {
                console.log(done)
                const {value, done: doneReading} = await reader.read().catch((error)=>{
                    toast.error('Error streaming response from the API. Please try again later.');
                });
                done = doneReading;
                if (value) {
                    const text = decoder.decode(value);
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    setBuilderOutput(prev => [...prev, ...lines]);
                    setOutput(prev => [...prev, ...lines]);
                    // Search for the initialState message
                    const initialStateMessage = lines.find((line:string) => {
                        try {
                            const parsed = JSON.parse(line);
                            return parsed.msgType === 'initialState';
                        } catch (e) {
                            return false; // Not a valid JSON line
                        }
                    });

                    // Search for the final message
                    const finalMessage = lines.find((line:string) => {
                        try {
                            const parsed = JSON.parse(line);
                            return parsed.msgType === 'final';
                        } catch (e) {
                            return false; // Not a valid JSON line
                        }
                    });

                    if (initialStateMessage) {
                        try {
                            const parsedMessage = JSON.parse(initialStateMessage);
                            setStartMessage(parsedMessage);
                        } catch (e) {
                            console.error('Error parsing initial state message:', e);
                        }
                    }
                    if (finalMessage) {
                        try {
                            const parsedMessage = JSON.parse(finalMessage);
                            setFinalMessage(parsedMessage);
                        } catch (e) {
                            console.error('Error parsing final message:', e);
                        }
                    }
                }
            }
            toast.error("Reading Finished")
        }
        wrap()
    }, [])
    useEffect(() => {
       console.log(startMessage)
    }, [startMessage]);
    useEffect(() => {
        console.log(finalMessage)

        if(!finalMessage || !finalMessage.data.duration) return
        // Add the duration
        let duration = ''
        duration += finalMessage.data.duration.days ? `${finalMessage.data.duration.days}d` : '';
        duration += finalMessage.data.duration.hours ? `${finalMessage.data.duration.hours}h` : '';
        duration += finalMessage.data.duration.minutes ? ` ${finalMessage.data.duration.minutes}m` : '';
        duration += finalMessage.data.duration.seconds ? `${finalMessage.data.duration.seconds}s` : '';

        setDuration(duration);


        setDuration(duration);

    }, [finalMessage]);

    useEffect(() => {
        const parsedOutput = output.map((line) => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return line; // If parsing fails, return the original line
            }
        })
        parsedOutput.forEach((line)=>{
            if(line.msgType === "statusUpdate"){
                // Update the startMessage state with the status update
                setStartMessage((prev) => ({
                    ...prev,
                    data: {
                        ...prev?.data,
                        status: line.data,
                    }
                }));
            }
        })
        // Loop over all messages and update the state if a message of type
    }, [output]);
    return(
        <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-4 items-center">

                <a href="/app/builders">
                    <Button variant="ghost">
                        <ArrowLeft />
                    </Button>
                </a>
                <div className="flex flex-col">
                    <h1>Build Logs</h1>
                    <div className="text-muted-foreground text-sm">
                        Viewing logs for run ID: <span className="text-green-600">{id}</span>
                    </div>
                </div>
            </div>
            <Card>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-2">
                        {
                            !startMessage ? <div className="text-gray-500">Loading...</div> :
                                (
                                    <div className="flex flex-row gap-4">
                                        <div className="flex flex-row gap-2 items-center">
                                            <Calendar size={13} />
                                            <div className="flex flex-col gap-2">
                                                <div>
                                                    {new Date(startMessage.data.started_at).toLocaleDateString()}
                                                </div>
                                                <div>
                                                    {new Date(startMessage.data.started_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-row gap-2 items-center">
                                            <Clock size={13}/>
                                            {duration}
                                        </div>
                                        <div className="items-center flex flex-row gap-2">
                                            <Badge className={`text-xs ${badgeColors[startMessage.data.status.toLowerCase()]}`}>
                                                {startMessage.data.status}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                        }
                        <div className="flex items-center gap-2 justify-end">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    className="pl-8 h-9 md:w-[200px]"
                                />
                            </div>
                            <div>
                                Filter
                            </div>
                            <div>
                                Follow
                            </div>
                        </div>
                    </div>
                    <div className="font-mono text-sm overflow-y-auto h-[800px] border-accent border-2 rounded-md p-4">
                        {
                            output.filter((line)=>{return line.includes('"msgType":"output"')}).length === 0 ? (
                                <div className="text-muted-foreground text-center text-sm">
                                    No output received yet.
                                </div>
                                ) :
                            output.map((line, index)=>{
                                let parsedLine = undefined
                                try{
                                    parsedLine = JSON.parse(line);
                                }
                                catch(e){
                                    return line
                                }
                                const data = parsedLine.data || undefined;
                                if(!data) return null
                                if(typeof data === 'object') return

                                let returnLine = ''
                                let returnType = 'STDOUT'
                                try{
                                    const parsedData = JSON.parse(data)
                                    returnLine = parsedData.stdout
                                    if(!returnLine){
                                        returnLine = data
                                    }
                                }
                                catch(err){
                                    return null
                                }

                                if(returnLine.includes('warning') || returnLine.includes('warn')) {
                                    returnType = 'WARNING';
                                }

                                if(returnLine.includes('error') || returnLine.includes('Error')) {
                                    // Check if this line really is an error (for example libpgp-error would be detected by this)
                                    // First we get the index of the error string and then check if the next character is a space or a colon
                                    const errorIndex = returnLine.search(/error/i);
                                    if (errorIndex !== -1 && (returnLine[errorIndex + 5] === ' ' || returnLine[errorIndex + 5] === ':')) {
                                        returnType = 'ERROR';
                                    }
                                }
                                return (
                                    <div key={index} className="flex flex-row gap-4">
                                        <div className="text-muted-foreground">
                                            {index}
                                        </div>
                                        <div className={`flex flex-row gap-2 ${textColors[returnType]}`}>
                                            <div className={`flex justify-start items-start`}>
                                                [{returnType}]
                                            </div>
                                            {returnLine}
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className="text-muted-foreground text-sm grid grid-cols-2">
                        <div>
                            Showing {output.length} of {builderOutput.length} lines
                        </div>
                        <div className="flex flex-row gap-2 items-center justify-end">
                            <div className="flex flex-row gap-2 items-center">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <div className="gap-1 flex flex-row items-center">
                                    <span>
                                        Error:
                                    </span>
                                    {
                                        builderOutput.filter((line)=>{
                                            if(!line.includes('Error') && !line.includes('error')) return false

                                            const errorIndex = line.search(/error/i);
                                            if (errorIndex !== -1 && (line[errorIndex + 5] === ' ' || line[errorIndex + 5] === ':')) {
                                                return true
                                            }
                                            return false
                                        }).length
                                    }
                                </div>
                            </div>
                            <div className="flex flex-row gap-1 items-center">
                                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                <div>
                                    Warning:
                                </div>
                                {
                                    builderOutput.filter((line)=>{
                                        if(line.includes('Warning') || line.includes('warning') || line.includes('warn')){
                                            return true
                                        }
                                    }).length
                                }
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <div className="h-2 w-2 rounded-full bg-accent-foreground"></div>
                                <div>
                                    Stdout
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Toaster />
        </div>
    )
}