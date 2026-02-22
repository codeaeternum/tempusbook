import { useMemo } from 'react';

export interface CalendarEvent {
    id: string;
    title: string;
    client: string;
    service: string;
    staff: string;
    start: Date;
    end: Date;
    status: 'confirmed' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
    color: string;
}

export interface LayoutEvent extends CalendarEvent {
    top: number;      // px from grid top
    height: number;   // px height
    left: number;     // % from left (0-100)
    width: number;    // % width
}

/**
 * Hook to calculate visual layout for calendar events, handling overlapping
 * by using a greedy graph coloring approach.
 * Memoized to prevent heavy recalculations on unrelated state changes (e.g., opening a modal).
 */
export function useCalendarLayout(
    events: CalendarEvent[],
    startHour: number = 7,
    hourHeight: number = 80
): LayoutEvent[] {
    return useMemo(() => {
        if (!events || events.length === 0) return [];

        const sorted = [...events].sort((a, b) =>
            a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime()
        );

        // Group into overlapping clusters
        const clusters: CalendarEvent[][] = [];
        let currentCluster: CalendarEvent[] = [];
        let clusterEnd = 0;

        for (const evt of sorted) {
            const evtStartMin = evt.start.getHours() * 60 + evt.start.getMinutes();
            if (currentCluster.length === 0 || evtStartMin < clusterEnd) {
                currentCluster.push(evt);
                const evtEndMin = evt.end.getHours() * 60 + evt.end.getMinutes();
                clusterEnd = Math.max(clusterEnd, evtEndMin);
            } else {
                clusters.push(currentCluster);
                currentCluster = [evt];
                clusterEnd = evt.end.getHours() * 60 + evt.end.getMinutes();
            }
        }
        if (currentCluster.length > 0) clusters.push(currentCluster);

        // Layout each cluster
        const result: LayoutEvent[] = [];

        for (const cluster of clusters) {
            // Assign columns — greedy algorithm
            const columns: CalendarEvent[][] = [];

            for (const evt of cluster) {
                const evtStartMin = evt.start.getHours() * 60 + evt.start.getMinutes();
                let placed = false;
                for (const col of columns) {
                    const lastInCol = col[col.length - 1];
                    const lastEndMin = lastInCol.end.getHours() * 60 + lastInCol.end.getMinutes();
                    if (evtStartMin >= lastEndMin) {
                        col.push(evt);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    columns.push([evt]);
                }
            }

            const numCols = columns.length;
            for (let colIdx = 0; colIdx < numCols; colIdx++) {
                for (const evt of columns[colIdx]) {
                    const startMin = evt.start.getHours() * 60 + evt.start.getMinutes();
                    const endMin = evt.end.getHours() * 60 + evt.end.getMinutes();
                    const durationMin = endMin - startMin;

                    result.push({
                        ...evt,
                        top: ((startMin - startHour * 60) / 60) * hourHeight,
                        height: Math.max((durationMin / 60) * hourHeight, 44),
                        left: (colIdx / numCols) * 100,
                        width: (1 / numCols) * 100,
                    });
                }
            }
        }

        return result;
    }, [events, startHour, hourHeight]);
}
