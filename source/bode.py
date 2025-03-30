'''
Created on 30.3.25

@author: Dennis Rathgeb
'''

import sys, time

import numpy as np
import matplotlib.pyplot as plt


from awgdrivers.constants import SINE

AWG_CHANNEL = 1
AWG_AMPLITUDE = 1.0
AWG_OFFSET = 0.0
AWG_PHASE = 0.0
AWG_WAVE_TYPE = SINE
AWG_OUTPUT_IMPEDANCE = 50.0   
class BodePlotter:
    def __init__(self, awg, scope):
        self.awg = awg
        self.scope = scope
        self.n_samples = 10
        self.tolerance = 0.2  
        self.start_freq = 100
        self.stop_freq = 100e3
        self.num_points = 20
        self.amplitude = AWG_AMPLITUDE
        self.frequencies = None
        self.scope_timebase = None

    def set_params(self, params: dict):
        self.start_freq = params.get("start_freq", self.start_freq)
        self.stop_freq = params.get("stop_freq", self.stop_freq)
        self.num_points = params.get("num_points", self.num_points)
        self.n_samples = params.get("n_samples", self.n_samples)
        self.amplitude = params.get("amplitude", self.amplitude)
        self.tolerance = params.get("tolerance", self.tolerance)

    def get_params(self) -> dict:
        return {
            "start_freq": self.start_freq,
            "stop_freq": self.stop_freq,
            "num_points": self.num_points,
            "n_samples": self.n_samples,
            "amplitude": self.amplitude,
            "tolerance": self.tolerance
        }
    
    def setup_awg(self):
        """
        Setup the AWG with the given parameters.
        """
        self.awg.set_phase(AWG_PHASE)
        self.awg.set_wave_type(AWG_CHANNEL, AWG_WAVE_TYPE)
        #self.awg.set_output_impedance(AWG_CHANNEL, AWG_OUTPUT_IMPEDANCE)
        self.awg.set_frequency(AWG_CHANNEL, self.start_freq)
        self.awg.set_amplitude(AWG_CHANNEL, self.amplitude)
        self.awg.set_offset(AWG_CHANNEL, AWG_OFFSET)
        self.awg.enable_output(AWG_CHANNEL, True)
        #awg.enable_output(2, False)


    def filter_outliers(self, data):
        """filters outliers in samples using median and threshold"""  
        median = np.median(data)
        return [x for x in data if abs(x - median) < self.tolerance * median]

    def filter_phase_outliers(self, data):
        """filters phase outliers in samples uses wrapp aroung calc to get the shortest distance"""
        median = np.median(data)
        def angle_diff(a, b):
            """Return signed shortest distance between two angles in degrees."""
            diff = (a - b + 180) % 360 - 180
            return abs(diff)
        return [x for x in data if angle_diff(x, median) < (self.tolerance * 180)]

    def collect_data_sample(self, freq, timebase):
        freq_meas = 0.0
        gain = 0.0
        phase = 0.0
        
        self.awg.set_frequency(1, int(freq))
        self.scope.set_timebase(timebase)

        # Get data from scope with avaraging
        s_rms1 = []
        s_rms2 = []
        s_phase = []
        #collect samples
        for i in range(self.n_samples):
            s_rms1.append(self.scope.query_rms(1))  
            s_rms2.append(self.scope.query_rms(2))
            s_phase.append(self.scope.query_pha(1, 2)) 
        
        # Apply filtering
        filtered_rms1 = self.filter_outliers(s_rms1)  
        filtered_rms2 = self.filter_outliers(s_rms2)
        filtered_phase = self.filter_phase_outliers(s_phase)
        
        if len(filtered_rms1) >= 1 and len(filtered_rms2) >= 1 and len(filtered_phase) >= 1:
            if self.n_samples > 1:
                rms1 = np.mean(filtered_rms1)
                rms2 = np.mean(filtered_rms2)
                pha = np.mean(filtered_phase)

                gain = (rms2 / rms1)
                phase = (pha)
            else:
                gain = (filtered_rms2[0] / filtered_rms1[0])
                phase = (filtered_phase[0])
            freq_meas = (self.scope.query_freq(1))
        else:
            print("for freq %d too much noise: length  rms1:%d, rms2:%d, phase:%d" % (freq, len(filtered_rms1), len(filtered_rms2), len(filtered_phase)))
        return freq_meas, gain, phase

    def setup_run(self):  
        """
        Perform a Bode plot using the AWG and scope.
        """
        self.setup_awg()
        time.sleep(0.2)  
        self.scope.auto_setup()

        # Set up frequency sweep
        self.frequencies = np.logspace(np.log10(self.start_freq), np.log10(self.stop_freq), self.num_points)
        # set up timebase sweeping
        self.scope_timebase = (1 / (self.frequencies*2)) #show 1/2 period per divisions on the screen
        self.scope_timebase= [self.scope.clamp_timebase(tb) for tb in self.scope_timebase]

        
    def run(self):
        freq_meas = []
        gain = []
        phase = []
        if(self.frequencies is None or self.scope_timebase is None):
            self.setup_run()
        for f,tb in zip(self.frequencies, self.scope_timebase):
            f,g,p  = self.collect_data_sample(f, tb)
            if f > 0:
                freq_meas.append(f)
                gain.append(g)
                phase.append(p)
            else:
                print("skipping freq %d" % f)
        return freq_meas, gain, phase

    def plot(self, freq, gain, phase):
        """
        Plot the Bode plot using Matplotlib.
        """
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
