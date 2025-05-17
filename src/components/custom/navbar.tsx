'use client'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger, navigationMenuTriggerStyle,
    NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import './navbar.css'
import Link from "next/link";
import {Button} from "@/components/ui/button";
import Image from "next/image";
import {Input} from "@/components/ui/input";
import CommandSwitcher from "@/components/custom/command";
import {useState} from "react";
export default function Navbar(){
    const [showCommand, setShowCommand] = useState(false);

    return(
        <NavigationMenu className="navbar">
            <NavigationMenuList>
                <NavigationMenuItem>
                   <Input placeholder="Search derivations..." onFocus={(event)=>{
                       event.preventDefault()
                       setShowCommand(true)
                   }}></Input>
                </NavigationMenuItem>
            </NavigationMenuList>
            {
                showCommand ? <CommandSwitcher callback={()=>{setShowCommand(false)}}/> : null
            }
        </NavigationMenu>
    )
}