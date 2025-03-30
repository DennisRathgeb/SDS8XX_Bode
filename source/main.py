import sys, time

import numpy as np
import matplotlib.pyplot as plt

from awg_factory import awg_factory
from oscillatordrivers.sds8xx import SDS8XX
from awgdrivers.constants import SINE
from bode import BodePlotter

DEFAULT_AWG = "FY6900"
DEFAULT_PORT = "COM13"
DEFAULT_BAUD_RATE = None

if __name__ == '__main__':
    # Extract AWG name from parameters
    if len(sys.argv) >= 2:
        awg_name = sys.argv[1]
    else:
        awg_name = DEFAULT_AWG
        
    # Extract port name from parameters
    if len(sys.argv) >= 3:
        awg_port = sys.argv[2]
    else:
        awg_port = DEFAULT_PORT
        
    # Extract AWG port baud rate from parameters
    if len(sys.argv) == 4:
        awg_baud_rate = int(sys.argv[3])
    else:
        awg_baud_rate = DEFAULT_BAUD_RATE  
    
    # Initialize AWG
    print("Initializing AWG...")
    print("AWG: %s" % awg_name)
    print("Port: %s" % awg_port)
    awg_class = awg_factory.get_class_by_name(awg_name)
    awg = awg_class(awg_port, awg_baud_rate)
    awg.initialize()
    

    print("Initializing scope...")
    scope = SDS8XX()
    if scope.connect():
        print("Scope connected.")

    bode = BodePlotter(awg, scope)
    bode.n_samples = 5
    bode.start_freq = 100
    bode.stop_freq = 100e3
    bode.num_points = 20
    bode.amplitude = 1.0

    freq, gain,phase = bode.run()
    print("Bode plot data collected.")
    bode.plot(freq, gain, phase)
    print("Bode plot completed.")
    