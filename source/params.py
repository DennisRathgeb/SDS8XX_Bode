from pydantic import BaseModel, Field

MAX_AWG_FREQ = 99999999
#model for awg connect request
class PortRequest(BaseModel):
    port: str
#settings for the Bodeplotter
class BodeSettings(BaseModel):
    start_freq: float = Field(..., gt=0, lt=MAX_AWG_FREQ)
    stop_freq: float = Field(..., gt=0, lt=MAX_AWG_FREQ)
    num_points: int = Field(..., gt=1, lt=1000)
    n_samples: int = Field(..., gt=0, lt=100)
    amplitude: float = Field(..., ge=0.1, le=5.0)
    tolerance: float = Field(default=0.2, ge=0, le=1.0)
