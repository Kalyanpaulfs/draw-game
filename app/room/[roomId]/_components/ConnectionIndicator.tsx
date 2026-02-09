/**
 * ConnectionIndicator - Visual Network Quality Feedback
 * 
 * Shows connection quality with signal bars.
 * Updates based on WebRTC stats.
 */

'use client';

import React from 'react';
import {
    ConnectionQuality,
    getQualityColor,
    getQualityBars
} from '@/lib/voice/NetworkQualityMonitor';

interface ConnectionIndicatorProps {
    quality: ConnectionQuality;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function ConnectionIndicator({
    quality,
    showLabel = false,
    size = 'md'
}: ConnectionIndicatorProps) {
    const bars = getQualityBars(quality);
    const color = getQualityColor(quality);

    const barHeights = {
        sm: [4, 6, 8, 10],
        md: [6, 9, 12, 15],
        lg: [8, 12, 16, 20],
    };

    const barWidth = size === 'sm' ? 2 : size === 'md' ? 3 : 4;
    const gap = size === 'sm' ? 1 : 2;

    const heights = barHeights[size];

    return (
        <div className="flex items-end gap-0.5" title={`Connection: ${quality}`}>
            {heights.map((height, index) => (
                <div
                    key={index}
                    className="rounded-sm transition-colors duration-300"
                    style={{
                        width: barWidth,
                        height: height,
                        marginRight: gap,
                        backgroundColor: index < bars ? color : '#374151', // gray-700 for inactive
                        opacity: index < bars ? 1 : 0.3,
                    }}
                />
            ))}
            {showLabel && (
                <span
                    className="ml-1 text-xs font-medium capitalize"
                    style={{ color }}
                >
                    {quality}
                </span>
            )}
        </div>
    );
}

/**
 * NetworkWarning - Warning banner for poor connection.
 */
interface NetworkWarningProps {
    quality: ConnectionQuality;
    isVisible: boolean;
}

export function NetworkWarning({ quality, isVisible }: NetworkWarningProps) {
    if (!isVisible || quality === 'excellent' || quality === 'good') {
        return null;
    }

    const getMessage = () => {
        switch (quality) {
            case 'fair':
                return 'Connection quality is degraded. Some audio lag may occur.';
            case 'poor':
                return 'Poor connection detected. Voice may be choppy.';
            case 'critical':
                return 'Very poor connection. Voice chat may not work properly.';
            default:
                return '';
        }
    };

    const getBgColor = () => {
        switch (quality) {
            case 'fair': return 'bg-yellow-500/10 border-yellow-500/20';
            case 'poor': return 'bg-orange-500/10 border-orange-500/20';
            case 'critical': return 'bg-red-500/10 border-red-500/20';
            default: return '';
        }
    };

    const getTextColor = () => {
        switch (quality) {
            case 'fair': return 'text-yellow-400';
            case 'poor': return 'text-orange-400';
            case 'critical': return 'text-red-400';
            default: return '';
        }
    };

    return (
        <div
            className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 
        px-4 py-2 rounded-lg border
        flex items-center gap-2
        z-40 animate-fade-in
        ${getBgColor()}
      `}
        >
            <ConnectionIndicator quality={quality} size="sm" />
            <span className={`text-sm font-medium ${getTextColor()}`}>
                {getMessage()}
            </span>
        </div>
    );
}
