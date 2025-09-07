"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function Header() {
    const pathname = usePathname()

    const navItems = [
        {
            href: "/",
            label: "Home",
            isActive: pathname === "/",
        },
        {
            href: "/chord-practice",
            label: "Practice",
            isActive: pathname === "/chord-practice",
        },
    ]

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex h-14 items-center justify-between">
                    {/* Logo/Brand */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-sm">🎸</span>
                            </div>
                            <span className="font-bold text-lg">Guitar Chord Trainer</span>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center space-x-2">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={item.isActive ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "transition-colors",
                                        item.isActive && "shadow-sm"
                                    )}
                                >
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    )
}
