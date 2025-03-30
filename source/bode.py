'''
Created on May 5, 2018

@author: dima
'''

import sys, time

import numpy as np
import matplotlib.pyplot as plt

from awg_factory import awg_factory
from oscillatordrivers.sds8xx import SDS8XX
from awgdrivers.constants import SINE

DEFAULT_AWG = "FY6900"
DEFAULT_PORT = "COM13"
DEFAULT_BAUD_RATE = None
def setup_awg(awg, channel, signal_type, frequency, amplitude, offset, phase):
    """
    Setup the AWG with the given parameters.
    """
    awg.set_phase(phase)
    awg.set_wave_type(channel, signal_type)
    awg.set_frequency(channel, frequency)
    awg.set_amplitude(channel, amplitude)
    awg.set_offset(channel, offset)
    
    awg.enable_output(channel, True)
    #awg.enable_output(2, False)

def filter_outliers(data, threshold=0.2):
    """filters outliers in samples using median and threshold"""  
    median = np.median(data)
    return [x for x in data if abs(x - median) < threshold * median]

def filter_phase_outliers(data, threshold=20):
    """filters phase outliers in samples uses wrapp aroung calc to get the shortest distance"""
    median = np.median(data)
    def angle_diff(a, b):
        """Return signed shortest distance between two angles in degrees."""
        diff = (a - b + 180) % 360 - 180
        return abs(diff)
    return [x for x in data if angle_diff(x, median) < threshold]

def bode(awg, scope, start_freq, stop_freq, num_points, n_samples=10, tolerance=0.2):  
    """
    Perform a Bode plot using the AWG and scope.
    """
    setup_awg(awg, channel=1, signal_type=SINE, frequency=start_freq, amplitude=1.0, offset=0.0, phase=0.0)
    time.sleep(0.2)  
    scope.auto_setup()
    # Set up frequency sweep
    frequencies = np.logspace(np.log10(start_freq), np.log10(stop_freq), num_points)
    # set up timebase sweeping
    scope_timebase = (1 / (frequencies*2)) #show 1/2 period per divisions on the screen
    scope_timebase= [scope.clamp_timebase(tb) for tb in scope_timebase]
    
    freq_meas = []
    gain = []
    phase = []
    # Loop through frequencies
    for freq, tb in zip(frequencies,scope_timebase):
        awg.set_frequency(1, int(freq))
        scope.set_timebase(tb)

        # Get data from scope with avaraging
        s_rms1 = []
        s_rms2 = []
        s_phase = []

        for i in range(n_samples):
            s_rms1.append(scope.query_rms(1))  
            s_rms2.append(scope.query_rms(2))
            s_phase.append(scope.query_pha(1, 2)) 
        
        # Apply filtering
        filtered_rms1 = filter_outliers(s_rms1, threshold=tolerance)  
        filtered_rms2 = filter_outliers(s_rms2, threshold=tolerance)
        filtered_phase = filter_phase_outliers(s_phase, threshold=(tolerance*180))
        
        if len(filtered_rms1) >= 1 and len(filtered_rms2) >= 1 and len(filtered_phase) >= 1:
            if n_samples > 1:
                rms1 = np.mean(filtered_rms1)
                rms2 = np.mean(filtered_rms2)
                pha = np.mean(filtered_phase)

                gain.append(rms2 / rms1)
                phase.append(pha)
            else:
                gain.append(filtered_rms2[0] / filtered_rms1[0])
                phase.append(filtered_phase[0])
            freq_meas.append(scope.query_freq(1))
        else:
            print("skipping freq %d: length  rms1:%d, rms2:%d, phase:%d" % (freq, len(filtered_rms1), len(filtered_rms2), len(filtered_phase)))

    return freq_meas, gain, phase

def plot_bode(freq, gain, phase):
    
    # Plot gain in log space
    plt.figure()
    plt.subplot(2, 1, 1)
    plt.semilogx(freq, 20 * np.log10(gain), label="Gain (dB)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Gain (dB)")
    plt.title("Bode Plot - Gain")
    plt.grid(which="both", linestyle="--", linewidth=0.5)
    plt.legend()

    # Plot phase
    plt.subplot(2, 1, 2)
    plt.semilogx(freq, phase, label="Phase (degrees)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Phase (degrees)")
    plt.title("Bode Plot - Phase")
    plt.ylim(-180, 180)
    plt.grid(which="both", linestyle="--", linewidth=0.5)
    plt.legend()

    plt.show()

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
    freq, gain, phase = bode(awg, scope, 100, 100e3, 20)
    print("Bode plot completed.")
    plot_bode(freq, gain, phase)
    
    

