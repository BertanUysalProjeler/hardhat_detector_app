# backend/app/ws_manager.py
from typing import List, Optional
from fastapi import WebSocket
import asyncio

class WSManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # remember the running loop so background threads can schedule coroutines
        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = None

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def _broadcast_json(self, message: dict):
        # send_json to all, drop broken sockets
        bad = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except Exception:
                bad.append(ws)
        for ws in bad:
            self.disconnect(ws)

    def broadcast(self, message: dict):
        """
        Thread-safe: can be called from your background detection thread.
        Schedules an async send_json on the main event loop.
        """
        if self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(self._broadcast_json(message), self.loop)
        else:
            # Fallback (e.g. during unit tests)
            asyncio.run(self._broadcast_json(message))

ws_manager = WSManager()