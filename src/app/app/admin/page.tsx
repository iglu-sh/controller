'use client'
import {api} from "@/trpc/react";
import {useEffect} from "react";
import {Button} from "@/components/ui/button";

export default function AdminPage(){
    const nodes = api.builder.getRegisteredNodes.useQuery()
    const builders = api.builder.getAllBuilders.useQuery({cache: 1})
    useEffect(()=>{
        console.log(nodes)
    }, [nodes.data])
    function sendTestJob(nodeName:string){

    }
    return (
        <div>
            <h1>Admin Page</h1>
            <p>This is the admin page.</p>
            <h2>Registered Nodes</h2>
            <table>
                <thead>
                <tr>
                    <th>Node Name</th>
                    <th>Node Address</th>
                    <th>Node Port</th>
                    <th>Node OS</th>
                    <th>Node Arch</th>
                    <th>Node Max Jobs</th>
                </tr>
                </thead>
                <tbody className="">
                {nodes.data?.map((node) => (
                    <tr key={node.node_name}>
                        <td>{node.node_name}</td>
                        <td>{node.node_address}</td>
                        <td>{node.node_port}</td>
                        <td>{node.node_os}</td>
                        <td>{node.node_arch}</td>
                        <td>{node.node_max_jobs}</td>
                        <Button>Send Test Job</Button>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}