/**
 * Learning Manager - Always-on continuous learning
 *
 * Task: Learn that [IN-1 + IN-2] should activate OUT-1 (first half of motor)
 *       more than OUT-2 (second half of motor)
 *
 * This creates true competition between two equal output channels.
 */

class LearningManager {
    constructor(network) {
        this.network = network;

        // The learning task
        this.inputPattern = [1, 1, 0];  // IN-1 and IN-2 active

        // Trial timing
        this.trialInterval = 60;  // Frames between trials
        this.settleTime = 30;     // Frames to wait for network response
        this.frameCount = 0;

        // Current trial state
        this.trialActive = false;
        this.trialStartFrame = 0;
        this.currentInput = [0, 0, 0];

        // Results tracking
        this.totalTrials = 0;
        this.recentResults = [];     // Last N trial results (1=success, 0=fail)
        this.successHistory = [];    // Success rate over time for plotting
        this.weightHistory = [];     // Average weight delta over time
        this.maxHistory = 100;

        // Current outputs (for display)
        this.out1Value = 0;
        this.out2Value = 0;
        this.lastResult = null;  // 'success', 'fail', or null
    }

    /**
     * Update - called every frame when simulation is running
     */
    update() {
        this.frameCount++;

        // Start new trial periodically
        if (!this.trialActive && this.frameCount % this.trialInterval === 0) {
            this.startTrial();
        }

        // Always update output values for display (do this BEFORE evaluation)
        this.updateOutputs();

        // Check trial result after settle time
        if (this.trialActive) {
            const elapsed = this.frameCount - this.trialStartFrame;

            if (elapsed >= this.settleTime) {
                this.evaluateTrial();
            }
        }
    }

    /**
     * Start a new learning trial
     */
    startTrial() {
        this.trialActive = true;
        this.trialStartFrame = this.frameCount;
        this.currentInput = [...this.inputPattern];
        this.lastResult = null;

        // Inject the input pattern
        this.network.injectInput(this.inputPattern);
        this.totalTrials++;
    }

    /**
     * Get current output values from the network
     * Split motor region into two competing outputs
     */
    updateOutputs() {
        const motor = this.network.regions.motor;

        if (motor && motor.neurons.length > 0) {
            const midpoint = Math.floor(motor.neurons.length / 2);

            // OUT-1: First half of motor neurons (indices 0 to midpoint-1)
            let out1Activity = 0;
            for (let i = 0; i < midpoint; i++) {
                out1Activity += motor.neurons[i].activity;
            }
            this.out1Value = out1Activity / midpoint;

            // OUT-2: Second half of motor neurons (indices midpoint to end)
            let out2Activity = 0;
            const secondHalfCount = motor.neurons.length - midpoint;
            for (let i = midpoint; i < motor.neurons.length; i++) {
                out2Activity += motor.neurons[i].activity;
            }
            this.out2Value = out2Activity / secondHalfCount;
        } else {
            this.out1Value = 0;
            this.out2Value = 0;
        }
    }

    /**
     * Evaluate the trial result
     */
    evaluateTrial() {
        this.trialActive = false;

        // Success if OUT-1 > OUT-2 and OUT-1 > threshold
        const threshold = 0.08;
        const success = this.out1Value > this.out2Value && this.out1Value > threshold;

        this.lastResult = success ? 'success' : 'fail';

        // Broadcast reward to the network based on success
        const reward = success ? 1.5 : -1.2; // Stronger contrast
        if (typeof this.network.applyGlobalRewardSignal === 'function') {
            this.network.applyGlobalRewardSignal(reward, 0.08); // Higher learning rate
        }

        // Track results
        this.recentResults.push(success ? 1 : 0);
        if (this.recentResults.length > 20) {
            this.recentResults.shift();
        }

        // Calculate and store success rate
        const successRate = this.getSuccessRate();
        this.successHistory.push(successRate);
        if (this.successHistory.length > this.maxHistory) {
            this.successHistory.shift();
        }

        // Track recent learning activity (sum of lastWeightChange across connections)
        let learningActivity = 0;
        for (const conn of this.network.connections) {
            learningActivity += conn.lastWeightChange;
        }
        // Normalize by connection count
        learningActivity = learningActivity / Math.max(1, this.network.connections.length);

        this.weightHistory.push(learningActivity);
        if (this.weightHistory.length > this.maxHistory) {
            this.weightHistory.shift();
        }
    }

    /**
     * Get success rate from recent trials
     */
    getSuccessRate() {
        if (this.recentResults.length === 0) return 0;
        return this.recentResults.reduce((a, b) => a + b, 0) / this.recentResults.length;
    }

    /**
     * Get weight statistics
     */
    getWeightStats() {
        return this.network.getWeightStats();
    }

    /**
     * Reset all learning progress
     */
    reset() {
        this.totalTrials = 0;
        this.recentResults = [];
        this.successHistory = [];
        this.weightHistory = [];
        this.trialActive = false;
        this.lastResult = null;
        this.currentInput = [0, 0, 0];
        this.frameCount = 0;

        // Also reset network weights
        this.network.resetWeights();
    }
}
