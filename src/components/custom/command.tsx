import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import './command.css'
export default function CommandSwitcher({callback}:{callback:()=>void}) {
    return (
        <div className="commandWrapper" onClick={(event)=>{

            //Lmao
            for(const classList of event.target.classList){
                if(classList.includes("commandWrapper")){
                    callback()
                }
            }
        }}>
            <div>
                <Command style={{zIndex: 101}}>
                    <CommandInput placeholder="Type a command or search..."  />
                    <CommandList>
                        <CommandEmpty>501: Not implemented</CommandEmpty>
                    </CommandList>
                </Command>
            </div>
        </div>
    )
}