import time
import numpy as np
import serial.tools.list_ports
from fastapi import FastAPI, Body
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from awg_factory import awg_factory
from oscillatordrivers.sds8xx import SDS8XX
from awgdrivers.constants import SINE
from bode import BodePlotter
from params import BodeSettings, PortRequest

DEFAULT_AWG = "FY6900"
DEFAULT_PORT = "COM13"
DEFAULT_BAUD_RATE = None
     
# --- AWG, Scope & Bodeplotter instances---
awg = None
scope = None
bode = None

# --- FastAPI app ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- API Endpoints ---

@app.get("/")
def home():
    return {"message": "Bode Plotter API running"}

@app.get("/status")
def get_status():
    global awg, scope, bode

    # Check connections
    awg_connected = awg is not None and hasattr(awg, "ser") and awg.ser.is_open
    scope_connected = scope is not None and scope.is_connected()
    bode_ready = bode is not None

    return {
        "awg": "connected" if awg_connected else "disconnected",
        "scope": "connected" if scope_connected else "disconnected",
        "bode": "ready" if bode_ready else "not_ready"
    }
#--- AWG Endpoints ---
@app.get("/ports")
def list_serial_ports():
    ports = serial.tools.list_ports.comports()
    return {"ports": [port.device for port in ports]}



@app.post("/connect/awg")
def connect_awg(data: PortRequest):
    global awg, bode, scope
    port = data.port
    try:
        awg_class = awg_factory.get_class_by_name(DEFAULT_AWG)
        awg = awg_class(port, DEFAULT_BAUD_RATE)
        if not awg.connect():
            return {"status": "failed", "device": "awg"}

        awg.initialize()

        # Create BodePlotter if both connected
        if scope and scope.is_connected():
            bode = BodePlotter(awg, scope)

        return {"status": "connected", "device": "awg"}

    except Exception as e:
        return {"status": "error", "device": "awg", "detail": str(e)}

#---- SCOPE Endpoints ---
@app.post("/connect/scope")
def connect_scope():
    global scope, bode, awg

    scope = SDS8XX()
    if not scope.connect():
        return {"status": "not_found", "device": "scope"}

    # Create BodePlotter if both connected
    if awg and hasattr(awg, "ser") and awg.ser.is_open:
        bode = BodePlotter(awg, scope)

    return {"status": "connected", "device": "scope"}

#---- BODE Endpoints ---
@app.get("/bode/params")
def get_params():
    return bode.get_params()

@app.post("/bode/config")
def update_config(settings: BodeSettings):
    bode.set_params(settings.dict())
    return {"status": "ok", "updated": bode.get_params()}

@app.get("/bode/start")
def start_bode_plot():
    bode.setup_run()

    def stream():
        for f, tb in zip(bode.frequencies, bode.scope_timebase):
            freq, gain, phase = bode.collect_data_sample(f, tb)
            if freq > 0:
                yield f"data: {{" \
                      f"\"freq\": {freq}, " \
                      f"\"gain\": {gain}, " \
                      f"\"phase\": {phase}" \
                      f"}}\n\n"
            time.sleep(0.05)

    return StreamingResponse(stream(), media_type="text/event-stream")
