import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import {
    createChart,
    CrosshairMode,
    LineStyle,
    BaselineSeries,
    type IChartApi,
    type ISeriesApi,
    type Time,
} from 'lightweight-charts';

import type { BalanceTimelinePoint } from '@/types';
import { formatDisplayDate, formatCurrency } from '@/utils/formatters';

interface BalanceTimelineProps {
    data: BalanceTimelinePoint[];
}

interface AggregatedPoint {
    time: Time;
    balance: number;
    tooltipHtml: string;
}

function positionTooltipOppositeQuadrant(
    tooltip: HTMLDivElement,
    container: HTMLDivElement,
    x: number,
    y: number
) {
    const tRect = tooltip.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const padding = 8;
    const gap = 12;

    const left = x < cRect.width / 2
        ? Math.min(x + gap, cRect.width - tRect.width - padding)
        : Math.max(x - tRect.width - gap, padding);

    const top = y < cRect.height / 2
        ? Math.min(y + gap, cRect.height - tRect.height - padding)
        : Math.max(y - tRect.height - gap, padding);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

export function BalanceTimeline({ data }: BalanceTimelineProps) {
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Baseline'> | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;
        const container = chartContainerRef.current;

        const chart = createChart(container, {
            layout: { textColor: '#6b7280' },
            width: container.clientWidth,
            height: container.clientHeight,
            grid: { vertLines: { color: '#f9fafb' }, horzLines: { color: '#f9fafb' } },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { width: 1, color: '#9ca3af', style: LineStyle.Dashed },
                horzLine: { width: 1, color: '#9ca3af', style: LineStyle.Dashed },
            },
            rightPriceScale: { borderColor: '#d1d5db' },
            timeScale: { borderColor: '#d1d5db', timeVisible: false, secondsVisible: false },
        });
        chartRef.current = chart;

        const series = chart.addSeries(BaselineSeries, {
            baseValue: { type: 'price', price: 0 },
            topLineColor: '#059669',
            topFillColor1: 'rgba(5,150,105,0.28)',
            topFillColor2: 'rgba(5,150,105,0.05)',
            bottomLineColor: '#dc2626',
            bottomFillColor1: 'rgba(220,38,38,0.05)',
            bottomFillColor2: 'rgba(220,38,38,0.28)',
            lineWidth: 1,
            priceFormat: { type: 'custom', formatter: formatCurrency },
        });
        seriesRef.current = series;

        // --- Aggregate by date ---
        const aggregated: AggregatedPoint[] = [];
        const lookup = new Map<Time, AggregatedPoint>();
        const dateMap = new Map<string, BalanceTimelinePoint[]>();

        for (const p of data) {
            const arr = dateMap.get(p.date) ?? [];
            arr.push(p);
            dateMap.set(p.date, arr);
        }

        // --- Pre-build CSS once ---
        const transactionRowStyle = `font-size:0.8rem; color:#000; display:flex; justify-content:space-between`;
        const costCenterStyle = `
            display:inline-block;
            background-color:#fef3c7;
            color:#92400e;
            font-size:0.7rem;
            font-weight:500;
            line-height:20px;
            height:20px;
            padding:0 6px;
            border-radius:10px;
            margin-bottom:4px;
            white-space:nowrap;
        `;

        for (const [dateStr, transactions] of dateMap) {
            const balance = transactions[transactions.length - 1].balance;
            const time = Math.floor(new Date(dateStr).getTime() / 1000) as Time;
            const dateLabel = formatDisplayDate(transactions[0].date);

            // Generate transaction HTML rows with minimal repetition
            const transactionsHtml = transactions.map((t) => `
            <div style="${transactionRowStyle}; display:flex; flex-direction:column;">
                <span>${t.description}</span>

                <div style="display:flex; justify-content:space-between; margin-top:6px;">
                    <span style="${costCenterStyle}">
                        ${t.cost_center_name}
                    </span>
                    <span style="${t.amount >= 0 ? 'color:#059669' : 'color:#dc2626'}; font-weight:600; text-align:right;">
                        ${formatCurrency(t.amount)}
                    </span>
                </div>
            </div>
            `).join('');

            const tooltipHtml = `
            <div style="background: white;padding:12px 14px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.16);border:1px solid #e5e7eb;min-width:220px;max-width:320px;">
                <div style="font-size:0.9rem;font-weight:600;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">
                    ${dateLabel}${transactions.length > 1 ? ` (${transactions.length} transactions)` : ''}
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${transactionsHtml}
                </div>
                <div style="font-size:0.85rem;color:#6b7280;padding-top:8px;margin-top:8px;border-top:1px solid #e5e7eb;">
                    End of day balance:
                    <span style="font-weight:600;color:${balance >= 0 ? '#059669' : '#dc2626'};">${formatCurrency(balance)}</span>
                </div>
            </div>`;

            const point: AggregatedPoint = { time, balance, tooltipHtml };
            aggregated.push(point);
            lookup.set(time, point);
        }

        aggregated.sort((a, b) => (a.time as number) - (b.time as number));
        series.setData(aggregated.map((p) => ({ time: p.time, value: p.balance })));
        chart.timeScale().fitContent();

        // --- Tooltip ---
        const tooltip = tooltipRef.current;
        let lastTime: Time | null = null;

        chart.subscribeCrosshairMove((param) => {
            if (!tooltip || !param.time || !param.point) {
                tooltip && (tooltip.style.display = 'none');
                lastTime = null;
                return;
            }
            if (param.time === lastTime) return;

            const point = lookup.get(param.time);
            if (!point) {
                tooltip.style.display = 'none';
                lastTime = null;
                return;
            }

            const y = series.priceToCoordinate(point.balance);
            if (y === null) {
                tooltip.style.display = 'none';
                lastTime = null;
                return;
            }

            tooltip.innerHTML = point.tooltipHtml;
            tooltip.style.display = 'block';
            positionTooltipOppositeQuadrant(tooltip, container, param.point.x, y);

            lastTime = param.time;
        });

        // --- Resize ---
        let resizeRaf: number | null = null;
        const handleResize = () => {
            if (resizeRaf) return;
            resizeRaf = requestAnimationFrame(() => {
                resizeRaf = null;
                chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
            });
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    if (data.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 33, color: '#6b7280' }}>
                <Typography variant="body2">No balance timeline data available.</Typography>
                <Typography variant="body2">Add transactions or change applied filters.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            <div ref={tooltipRef} style={{ position: 'absolute', display: 'none', pointerEvents: 'none', zIndex: 1000 }} />
        </Box>
    );
}