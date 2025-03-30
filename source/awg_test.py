# test_awg.py
from awgdrivers.fy6900 import FY6900
from awgdrivers.constants import SINE, SQUARE, HI_Z

awg = FY6900(port='COM13')  # Adjust to your actual port
awg.connect()

awg.set_frequency(1,1)
print("Signal configured. Check your scope.")
awg.disconnect()

#~/venv/bin/activate

#nmcli con show
#nmcli con mod "Wired connection 1" ipv4.method manual ipv4.addresses 192.168.0.1/24
#nmcli con up "Wired connection 1"