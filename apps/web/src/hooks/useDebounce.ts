import { useState, useEffect } from 'react';

/**
 * A hook that delays updating the returned value until `delay` milliseconds
 * have passed since the last time the `value` argument was updated.
 * 
 * Crucial for preventing massive re-renders on every keystroke when filtering 
 * large arrays like the POS Catalog or Client Database.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
