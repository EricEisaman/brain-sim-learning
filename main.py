from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import asyncio
import json


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler for startup/shutdown."""
    # Startup: start simulation loop
    task = asyncio.create_task(simulation_loop())
    yield
    # Shutdown: cancel the task
    task.cancel()


app = FastAPI(title="Brain Network Simulation", lifespan=lifespan)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Store active WebSocket connections
connections: list[WebSocket] = []

# Simulation state
simulation_state = {
    "running": False,
    "speed": 1.0,
    "tick": 0
}


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)

    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "control":
                action = message["action"]
                if action == "play":
                    simulation_state["running"] = True
                elif action == "pause":
                    simulation_state["running"] = False
                elif action == "step":
                    simulation_state["tick"] += 1
                    await broadcast_state()
                elif action == "reset":
                    simulation_state["tick"] = 0
                    simulation_state["running"] = False
                    await broadcast_state()

            elif message["type"] == "set_speed":
                simulation_state["speed"] = message["value"]

            elif message["type"] == "stimulate":
                # Handle stimulation - will be implemented with full simulation
                await broadcast_state()

            elif message["type"] == "input":
                # Handle input data - will be implemented with full simulation
                pass

    except WebSocketDisconnect:
        connections.remove(websocket)


async def broadcast_state():
    """Broadcast current simulation state to all connected clients."""
    if not connections:
        return

    # For now, send mock data - will be replaced with real simulation
    state = {
        "type": "state_update",
        "data": {
            "tick": simulation_state["tick"],
            "running": simulation_state["running"],
            "speed": simulation_state["speed"]
        }
    }

    for connection in connections:
        try:
            await connection.send_text(json.dumps(state))
        except:
            pass


async def simulation_loop():
    """Main simulation loop - runs in background."""
    while True:
        if simulation_state["running"]:
            simulation_state["tick"] += 1
            await broadcast_state()

        # Sleep based on speed (faster speed = shorter sleep)
        delay = 0.1 / max(simulation_state["speed"], 0.1)
        await asyncio.sleep(delay)


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

