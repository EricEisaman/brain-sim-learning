/**
 * Dashboard - Beautiful learning visualizations
 */

class Dashboard {
    constructor(network) {
        this.network = network;

        // Canvases
        this.successCanvas = document.getElementById('successPlot');
        this.weightsCanvas = document.getElementById('weightsPlot');
        this.successCtx = this.successCanvas?.getContext('2d');
        this.weightsCtx = this.weightsCanvas?.getContext('2d');

        // Region bars container
        this.regionBarsContainer = document.getElementById('regionBars');

        this.initialize();
    }

    initialize() {
        this.setupCanvases();
        this.setupRegionBars();
        window.addEventListener('resize', () => {
            this.setupCanvases();
        });
    }

    setupCanvases() {
        [this.successCanvas, this.weightsCanvas].forEach(canvas => {
            if (canvas) {
                const rect = canvas.parentElement.getBoundingClientRect();
                canvas.width = rect.width - 20;
                canvas.height = 80;
            }
        });
    }

    setupRegionBars() {
        if (!this.regionBarsContainer) return;

        this.regionBarsContainer.innerHTML = '';

        // Add bars for each region
        const regions = Object.entries(this.network.regions);
        regions.forEach(([id, region]) => {
            const bar = document.createElement('div');
            bar.className = 'region-bar';
            bar.innerHTML = `
                <div class="region-bar-fill" style="background: ${region.config.color}"></div>
                <span class="region-bar-label">${region.config.name.substring(0, 3)}</span>
            `;
            bar.dataset.regionId = id;
            this.regionBarsContainer.appendChild(bar);
        });

        // Add hub bar
        const hubBar = document.createElement('div');
        hubBar.className = 'region-bar';
        hubBar.innerHTML = `
            <div class="region-bar-fill" style="background: ${CONFIG.hub.color}"></div>
            <span class="region-bar-label">Hub</span>
        `;
        hubBar.dataset.regionId = 'hub';
        this.regionBarsContainer.appendChild(hubBar);
    }

    /**
     * Update all dashboard elements
     */
    update(learningManager) {
        this.updateTrialDisplay(learningManager);
        this.updateSuccessPlot(learningManager);
        this.updateWeightsPlot(learningManager);
        this.updateRegionBars();
        this.updateStats(learningManager);
        this.updateHUD(learningManager);
    }

    /**
     * Update the large HUD display
     */
    updateHUD(lm) {
        const successRate = lm.getSuccessRate();
        const successPct = Math.round(successRate * 100);

        // Update value
        const hudValue = document.getElementById('hudValue');
        if (hudValue) hudValue.textContent = successPct;

        // Update ring progress (circumference = 2 * PI * 54 = 339.292)
        const ring = document.getElementById('hudRingProgress');
        if (ring) {
            const circumference = 339.292;
            const offset = circumference * (1 - successRate);
            ring.style.strokeDashoffset = offset;
        }

        // Update trials
        const hudTrials = document.getElementById('hudTrials');
        if (hudTrials) hudTrials.textContent = lm.totalTrials;

        // Update status
        const hudStatus = document.getElementById('hudStatus');
        if (hudStatus) {
            hudStatus.className = 'hud-stat-value';
            if (lm.trialActive) {
                hudStatus.textContent = 'RUN';
                hudStatus.classList.add('running');
            } else if (lm.lastResult === 'success') {
                hudStatus.textContent = 'OK';
                hudStatus.classList.add('success');
            } else if (lm.lastResult === 'fail') {
                hudStatus.textContent = 'FAIL';
                hudStatus.classList.add('fail');
            } else {
                hudStatus.textContent = 'IDLE';
            }
        }

        // Update activity bars (show last 5 results)
        for (let i = 0; i < 5; i++) {
            const bar = document.getElementById(`hudBar${i + 1}`);
            if (bar) {
                const resultIndex = lm.recentResults.length - 5 + i;
                if (resultIndex >= 0 && resultIndex < lm.recentResults.length) {
                    bar.classList.toggle('active', lm.recentResults[resultIndex] === 1);
                } else {
                    bar.classList.remove('active');
                }
            }
        }

        // Pulse animation on result
        const hud = document.querySelector('.learning-hud');
        if (hud && lm.lastResult && !lm.trialActive) {
            hud.classList.remove('success', 'fail');
            // Trigger reflow
            void hud.offsetWidth;
            hud.classList.add(lm.lastResult);
        }
    }

    /**
     * Update the trial status display
     */
    updateTrialDisplay(lm) {
        // Trial number
        const trialNum = document.getElementById('trialNum');
        if (trialNum) trialNum.textContent = lm.totalTrials;

        // Trial status
        const trialStatus = document.getElementById('trialStatus');
        if (trialStatus) {
            if (lm.trialActive) {
                trialStatus.textContent = 'Running';
                trialStatus.className = 'trial-status running';
            } else if (lm.lastResult === 'success') {
                trialStatus.textContent = 'Success';
                trialStatus.className = 'trial-status success';
            } else if (lm.lastResult === 'fail') {
                trialStatus.textContent = 'Fail';
                trialStatus.className = 'trial-status fail';
            } else {
                trialStatus.textContent = 'Waiting';
                trialStatus.className = 'trial-status waiting';
            }
        }

        // Input pattern bits
        const inputPattern = document.getElementById('inputPattern');
        if (inputPattern) {
            const bits = inputPattern.querySelectorAll('.io-bit');
            bits.forEach((bit, i) => {
                if (lm.currentInput[i] > 0) {
                    bit.classList.add('on');
                    bit.classList.remove('off');
                } else {
                    bit.classList.remove('on');
                    bit.classList.add('off');
                }
            });
        }

        // Output bars
        const out1Bar = document.getElementById('out1Bar');
        const out2Bar = document.getElementById('out2Bar');
        if (out1Bar) {
            const pct = Math.min(100, lm.out1Value * 100);
            out1Bar.style.height = `${pct}%`;
        }
        if (out2Bar) {
            const pct = Math.min(100, lm.out2Value * 100);
            out2Bar.style.height = `${pct}%`;
        }
    }

    /**
     * Draw the success rate plot
     */
    updateSuccessPlot(lm) {
        if (!this.successCtx) return;

        const ctx = this.successCtx;
        const w = this.successCanvas.width;
        const h = this.successCanvas.height;
        const data = lm.successHistory;

        // Clear
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = '#1a1a2a';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (h / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // 50% baseline (dashed yellow)
        ctx.strokeStyle = '#ffaa00';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (data.length < 2) {
            ctx.fillStyle = '#444';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Waiting for data...', w / 2, h / 2 + 4);
            return;
        }

        // Draw success rate line
        const padding = 4;
        const step = w / Math.max(data.length - 1, 1);

        // Gradient fill under curve
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i < data.length; i++) {
            const x = i * step;
            const y = h - padding - (data[i] * (h - padding * 2));
            ctx.lineTo(x, y);
        }
        ctx.lineTo((data.length - 1) * step, h);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        for (let i = 0; i < data.length; i++) {
            const x = i * step;
            const y = h - padding - (data[i] * (h - padding * 2));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Current value dot
        if (data.length > 0) {
            const lastX = (data.length - 1) * step;
            const lastY = h - padding - (data[data.length - 1] * (h - padding * 2));

            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
            ctx.beginPath();
            ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('100%', 2, 10);
        ctx.fillText('0%', 2, h - 2);
    }

    /**
     * Draw the learning activity plot
     */
    updateWeightsPlot(lm) {
        if (!this.weightsCtx) return;

        const ctx = this.weightsCtx;
        const w = this.weightsCanvas.width;
        const h = this.weightsCanvas.height;
        const data = lm.weightHistory;

        // Clear
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#1a1a2a';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (h / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        if (data.length < 2) {
            ctx.fillStyle = '#444';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Waiting for data...', w / 2, h / 2 + 4);
            return;
        }

        // Find max for scaling (use a reasonable minimum)
        const maxVal = Math.max(...data, 0.001);

        const padding = 4;
        const step = w / Math.max(data.length - 1, 1);

        // Gradient fill
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i < data.length; i++) {
            const x = i * step;
            const y = h - padding - ((data[i] / maxVal) * (h - padding * 2));
            ctx.lineTo(x, y);
        }
        ctx.lineTo((data.length - 1) * step, h);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(255, 170, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line - orange/amber color for activity
        ctx.beginPath();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        for (let i = 0; i < data.length; i++) {
            const x = i * step;
            const y = h - padding - ((data[i] / maxVal) * (h - padding * 2));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('High', 2, 10);
        ctx.fillText('Low', 2, h - 2);
    }

    /**
     * Update region activity bars
     */
    updateRegionBars() {
        if (!this.regionBarsContainer) return;

        const bars = this.regionBarsContainer.querySelectorAll('.region-bar');
        bars.forEach(bar => {
            const id = bar.dataset.regionId;
            let activity = 0;

            if (id === 'hub') {
                // Hub activity
                const hub = this.network.hub;
                if (hub) {
                    activity = hub.neurons.reduce((sum, n) => sum + n.activity, 0) / hub.neurons.length;
                }
            } else {
                const region = this.network.regions[id];
                if (region) {
                    activity = region.totalActivity;
                }
            }

            const fill = bar.querySelector('.region-bar-fill');
            if (fill) {
                fill.style.height = `${Math.min(100, activity * 100)}%`;
            }
        });
    }

    /**
     * Update stats displays
     */
    updateStats(lm) {
        // Success rate
        const successPct = document.getElementById('successPct');
        if (successPct) {
            successPct.textContent = `${Math.round(lm.getSuccessRate() * 100)}%`;
        }

        // Total trials
        const totalTrials = document.getElementById('totalTrials');
        if (totalTrials) {
            totalTrials.textContent = lm.totalTrials;
        }

        // Weight stats
        const stats = lm.getWeightStats();
        const strengthened = document.getElementById('strengthenedCount');
        const weakened = document.getElementById('weakenedCount');

        if (strengthened) strengthened.textContent = stats.strengthened;
        if (weakened) weakened.textContent = stats.weakened;
    }
}
