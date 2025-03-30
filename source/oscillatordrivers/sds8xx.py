import pyvisa
import time
import numpy as np
import matplotlib.pyplot as plt

MAX_TIMEOUT = 10000
N_DIV_H = 10
N_DIV_V = 8

class SDS8XX:
    def __init__(self):
        self.rm = pyvisa.ResourceManager()
        self.scope = None
        self.idn = None
        

    def connect(self):
        print("Scanning USB-connected SIGLENT scopes...\n")
        devices = self.rm.list_resources()
        for res in devices:
            if "USB" in res:
                try:
                    dev = self.rm.open_resource(res)
                    idn = dev.query("*IDN?").strip()
                    if "Siglent" in idn:
                        self.scope = dev
                        self.idn = idn
                        self.scope.timeout = MAX_TIMEOUT
                        print(f"\nConnected to: {self.idn}")
                        return True
                except Exception as e:
                    print(f"Could not connect to {res}: {e}")

        print("\nNo Siglent SDS8XX scope found via USB.")
        return False

    def is_connected(self):
        return self.scope is not None


    # ---- LL send/recieve/query stuff ----
    def query(self, command):
        if self.scope:
            return self.scope.query(command).strip()
        else:
            raise Exception("Scope not connected.")

    def write(self, command):
        if self.scope:
            self.scope.write(command)
        else:
            raise Exception("Scope not connected.")

    # --- Basic channel Setup Commands ---
    def auto_setup(self):
        self.write("ASET")
        time.sleep(3)

    def set_vdiv(self, channel, volts_per_div):
        self.write(f"C{channel}:VDIV {volts_per_div}")

    def set_coupling(self, channel, mode):
        """mode: 'D1M' = DC, 'A1M' = AC, 'GND' = Ground"""
        self.write(f"C{channel}:CPL {mode}")

    def set_probe_attenuation(self, channel, ratio):
        """10x or 1x"""
        self.write(f"C{channel}:ATTN {ratio}")

    # --- Time stuff ----
    def set_timebase(self, time_per_div):
        self.write(f"TDIV {time_per_div}")

    def get_timebase(self):
        string = self.query("TDIV?")
        return float(string.replace("S", ""))
        

    def get_bandwidth(self, channel=1):
        #untested function
        result = self.query(f"C{channel}:BWL?")
        return result

    def get_sample_rate(self):
        response = self.query("SARA?")
        parts = response.strip().split()
        if len(parts) >= 2:
            rate_str = parts[1].replace("Sa/s", "")
            return float(rate_str)
        else:
            raise ValueError(f"Unexpected SARA? response: {response}")
        

    # --- Trigger / Control ---
    def run_single(self):
        self.write("TRMD SINGLE")
        self.write("ARM")

    def stop(self):
        self.write("STOP")

    def arm(self):
        self.write("ARM")

    def force_trigger(self):
        self.write("FRTR")
    #--- LL waveform capture ---
    def set_waveform(self, sparcing=1, n_points=1000, start = 0):
        """
        Configures the waveform settings for the specified channel.

        Parameters:
        - sparcing: The sparcing factor for waveform data. (every nth sample is captured.)
        - n_points: The number of points to capture in the waveform.
        - start: The starting point for the waveform capture.
        """
        self.scope.write(f"WFSU SP,{sparcing},NP,{n_points},FP,{start}") 

    def get_waveform(self, channel=1):
        self.scope.write(f"C{channel}:WF? DAT2")
    
    def read_raw(self):
        raw = self.scope.read_raw()
        return raw
    #--- sample stuff
    def get_relative_time_axis(self, n_points):
        """
        Returns a time axis starting at 0, ending at total displayed time (based on TDIV and screen width).
        """
        t_div = self.get_timebase()
        total_time = N_DIV_H * t_div
        return np.linspace(0, total_time, n_points)

    def get_sparcing(self, n_points):
        sample_rate = self.get_sample_rate()
        t_div = self.get_timebase()
        sparcing = int(t_div * N_DIV_H * sample_rate / n_points) 
        #print(f"samp rate: {sample_rate}")
        #print(f"t_div: {t_div}")  
        #print(f"sparcing: {sparcing}") 
        return sparcing

    def get_waveform_binary(self, channel=1, delay=0.5, n_points=1000):
        if not self.scope:
            raise RuntimeError("Scope not connected.")

        self.stop()
        self.run_single()
        self.arm()
        self.force_trigger()
        time.sleep(delay)

        sparcing = self.get_sparcing(n_points)

        self.set_waveform(sparcing=sparcing, n_points=n_points)
        # Request waveform data (data only)
        self.get_waveform(channel=channel)
        # Read and parse binary block
        raw = self.read_raw()

        return raw

    def parse_waveform_block(self, raw):
        # Find start of block marker
        start_idx = raw.find(b'#')
        if start_idx == -1:
            raise ValueError("Invalid block header")

        header_length = int(raw[start_idx + 1 : start_idx + 2])
        data_length = int(raw[start_idx + 2 : start_idx + 2 + header_length])
        data_start = start_idx + 2 + header_length
        data_end = data_start + data_length

        # Extract the waveform byte data
        data_bytes = raw[data_start:data_end]
        waveform = np.frombuffer(data_bytes, dtype=np.uint8) 
        waveform = waveform.astype(np.int8)
        return waveform
    def get_sample(self,channel=1,n_points=1000):
        times = scope.get_relative_time_axis(n_points=n_points)
        raw = scope.get_waveform_binary(channel=channel,n_points=n_points)
        waveform = scope.parse_waveform_block(raw)
        return [times, waveform]
    def plot_waveform(self, times, waveform):
        plt.figure(figsize=(10, 4))
        plt.plot(times * 1e6, waveform)  # Time in microseconds
        plt.title("Captured Waveform")
        plt.xlabel("Time (µs)")
        plt.ylabel("ADC Value (8-bit)")
        plt.grid(True)
        plt.tight_layout()
        plt.show()
        
#--- Measurement stuff ---
    def query_meas(self, max_attempts=100, delay=0.01, command="C1:PAVA? RMS", unit="V"):
        """
        Tries to query COMMAND value from C[channel] up to max_attempts.
        uses unit to split the response and get a value
        Returns float value or raises ValueError on failure.
        """
        for attempt in range(max_attempts):
            self.write(command)
            raw = self.read_raw()

            response = raw.decode("utf-8", errors="ignore").strip()
            parts = response.split(",")
            if len(parts) == 2 and "****" not in parts[1]:
                try:
                    value = parts[1].replace(unit, "").strip()
                    return float(value)
                except ValueError:
                    pass  # Fall through to retry
            time.sleep(delay)
        raise ValueError(f"Failed to get valid {command} value after {max_attempts} attempts.")

    def query_rms(self, channel):
        cmd = f"C{channel}:PAVA? RMS"
        return self.query_meas(command=cmd, unit="V") 

    def query_freq(self, channel):
        cmd = f"C{channel}:PAVA? FREQ"
        return self.query_meas(command=cmd, unit="Hz")

    def query_pkpk(self, channel):
        cmd = f"C{channel}:PAVA? PKPK"
        return self.query_meas(command=cmd, unit="V")  

    def query_pha(self, channel1=1, channel2=2):
        cmd = f"C{channel1}-C{channel2}:MEAD? PHA"
        return self.query_meas(command=cmd, unit="°")




