/**
 * HapticManager
 * Manages haptic feedback for on-target confirmation
 */

import * as Haptics from 'expo-haptics';

export interface HapticConfig {
    /** Enable/disable haptics */
    enabled?: boolean;
    /** Minimum time on target before triggering haptic (ms) */
    holdThresholdMs?: number;
    /** Interval between continuous haptics when on target (ms) */
    repeatIntervalMs?: number;
}

const DEFAULT_CONFIG: Required<HapticConfig> = {
    enabled: true,
    holdThresholdMs: 300,
    repeatIntervalMs: 500,
};

export class HapticManager {
    private config: Required<HapticConfig>;
    private onTargetStartTime: number = 0;
    private isOnTarget: boolean = false;
    private hasTriggeredInitial: boolean = false;
    private repeatTimer: ReturnType<typeof setInterval> | null = null;

    constructor(config: HapticConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Update on-target status
     * Call this every frame with the current on-target state
     */
    update(isOnTarget: boolean): void {
        if (!this.config.enabled) return;

        if (isOnTarget && !this.isOnTarget) {
            // Just started hitting target
            this.onTargetStartTime = Date.now();
            this.hasTriggeredInitial = false;
        } else if (isOnTarget && this.isOnTarget) {
            // Continuing to hit target
            const timeOnTarget = Date.now() - this.onTargetStartTime;

            if (timeOnTarget >= this.config.holdThresholdMs && !this.hasTriggeredInitial) {
                // Trigger initial haptic after hold threshold
                this.triggerSuccess();
                this.hasTriggeredInitial = true;
                this.startRepeat();
            }
        } else if (!isOnTarget && this.isOnTarget) {
            // Just left target
            this.stopRepeat();
            this.hasTriggeredInitial = false;
        }

        this.isOnTarget = isOnTarget;
    }

    /**
     * Trigger a success haptic feedback
     */
    private async triggerSuccess(): Promise<void> {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            // Haptics not available (e.g., on web)
        }
    }

    /**
     * Trigger a light haptic
     */
    private async triggerLight(): Promise<void> {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
            // Haptics not available
        }
    }

    /**
     * Start repeating haptic while on target
     */
    private startRepeat(): void {
        if (this.repeatTimer) return;

        this.repeatTimer = setInterval(() => {
            if (this.isOnTarget && this.hasTriggeredInitial) {
                this.triggerLight();
            }
        }, this.config.repeatIntervalMs);
    }

    /**
     * Stop repeating haptic
     */
    private stopRepeat(): void {
        if (this.repeatTimer) {
            clearInterval(this.repeatTimer);
            this.repeatTimer = null;
        }
    }

    /**
     * Set enabled state
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        if (!enabled) {
            this.stopRepeat();
        }
    }

    /**
     * Configure haptic settings
     */
    configure(config: HapticConfig): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Clean up
     */
    dispose(): void {
        this.stopRepeat();
    }
}

// Export singleton
export const hapticManager = new HapticManager();
