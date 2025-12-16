import { useEffect, useState } from "react";

export function useDebounce(value:any, dealy:number){
    const [debounceValue, setDebounceValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounceValue(value);
        }, dealy);

        return () => {
            clearTimeout(handler);
        };
    })
}