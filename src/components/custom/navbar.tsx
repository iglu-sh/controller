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
export default function Navbar(){
    return(
        <NavigationMenu className="navbar">
            <Link href="/app">
                <Image src={"/logo.jpeg"} alt={"Logo"} width={35} height={35} style={{
                    borderRadius: "var(--radius)",
                    marginRight: "5px"
                }}/>
            </Link>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>
                        <Link href="/app" passHref>
                            Home
                        </Link>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <Link href="/app/stats" passHref>
                            <NavigationMenuLink>
                                    Stats
                            </NavigationMenuLink>
                        </Link>
                        <Link href="/app/settings" passHref>
                            <NavigationMenuLink>
                                    Settings
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href={"/app/caches"} passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>Caches</NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="/app/documentation" passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>Documentation</NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink>
                        <Link href={"/app/caches/create"} passHref>
                            <Button>Create Cache</Button>
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}