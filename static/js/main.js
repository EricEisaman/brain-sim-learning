/**
 * Main application - Simplified always-on learning
 */

class Simulation {
    constructor() {
        // State
        this.running = false;
        this.speed = 1.0;

        // Modules
        this.brainRenderer = null;
        this.network = null;
        this.networkRenderer = null;
        this.dashboard = null;
        this.learningManager = null;

        // Learning is always on
        this.learningRate = 0.03;
        this.decayRate = 0.01;

        // Animation
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 60;

        this.initialize();
    }

    initialize() {
        const canvas = document.getElementById('brainCanvas');

        this.brainRenderer = new BrainRenderer(canvas);
        this.network = new Network(this.brainRenderer);
        this.networkRenderer = new NetworkRenderer(this.brainRenderer.ctx, this.network);
        this.dashboard = new Dashboard(this.network);
        this.learningManager = new LearningManager(this.network);

        // Always show weight visualization
        this.networkRenderer.showWeights = true;

        this.setupControls();

        window.addEventListener('resize', Utils.debounce(() => {
            this.brainRenderer.resize();
            this.network.handleResize();
        }, 100));

        this.startRenderLoop();
        window.simulation = this;
    }

    setupControls() {
        document.getElementById('playBtn')?.addEventListener('click', () => this.play());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.pause());
        document.getElementById('resetBtn')?.addEventListener('click', () => this.reset());

        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider?.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            if (speedValue) speedValue.textContent = `${this.speed.toFixed(1)}x`;
        });

        this.updateControlState();
    }

    updateControlState() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        if (playBtn) playBtn.classList.toggle('active', !this.running);
        if (pauseBtn) pauseBtn.classList.toggle('active', this.running);
    }

    play() {
        this.running = true;
        this.updateControlState();
    }

    pause() {
        this.running = false;
        this.updateControlState();
    }

    reset() {
        this.running = false;

        // Reset all neuron states
        for (const neuron of this.network.allNeurons) {
            neuron.activity = 0;
            neuron.potential = 0;
            neuron.refractory = 0;
        }

        // Reset all connections
        for (const conn of this.network.connections) {
            conn.activity = 0;
            conn.pulseActive = false;
        }

        // Reset stats
        this.network.stats.totalSignals = 0;
        this.network.stats.firingRate = 0;
        this.network.stats.signalsThisSecond = 0;

        // Reset learning
        this.learningManager.reset();

        this.updateControlState();
    }

    startRenderLoop() {
        const render = (timestamp) => {
            const elapsed = timestamp - this.lastFrameTime;

            if (elapsed >= this.frameInterval) {
                this.lastFrameTime = timestamp;

                if (this.running) {
                    // Update network with learning always enabled
                    this.network.update(this.speed, true, this.learningRate, this.decayRate);

                    // Update learning manager (handles trials automatically)
                    this.learningManager.update();
                }

                // Render
                this.brainRenderer.render();
                this.networkRenderer.render();

                // Update dashboard
                this.dashboard.update(this.learningManager);
            }

            requestAnimationFrame(render);
        };

        requestAnimationFrame(render);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Simulation();
});
