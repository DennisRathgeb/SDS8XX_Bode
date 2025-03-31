# SDS8XX Bode Plotter (Siglent + FY6900)

This project is a **web-based Bode plotter** for the **Siglent SDS8XX oscilloscope** and **Feelelec FY6900 AWG**, built with a Python + FastAPI backend and a modern React frontend. Can be easily adapted for other non-sigilent AWGs

Measure **gain and phase** across a frequency sweep in real-time, view results in your browser, and configure everything via sliders and input fields.

It is based on this [implementation](https://github.com/4x1md/sds1004x_bode) by [4x1md](https://github.com/4x1md) which emulates an Sigilent AWG to plot the Bode on the oscilloscope itself.

---

## Features

- Automatically connects to a Siglent SDS8XX oscilloscope over USB
- Select and connect FY6900 AWG over USB
- Live-updating Bode plots (gain & phase)
- Configurable start/stop frequency, number of points, averaging, amplitude, tolerance
- Streaming mode with real-time frontend updates
- Modern web UI using [V0.dev](https://v0.dev) + [Shadcn/UI](https://ui.shadcn.com/)
- Backend in FastAPI, communicating directly with both devices

---

## Project Structure

```
SDS8XX_Bode/
├── source/                # Python backend (FastAPI, device drivers, Bode logic)
│   ├── main.py            # FastAPI app
│   ├── bode.py            # BodePlotter class
│   ├── params.py          # Pydantic config model
│   └── awgdrivers/        # FY6900 driver
│   └── oscillatordrivers/ # Siglent SDS8XX driver
├── frontend/              # V0 React frontend
│   ├── components/        # UI components (settings, status, chart)
│   ├── app/               # Next.js pages
│   ├── api.ts             # API bindings to backend
│   └── types.ts           # Type definitions
├── run_bode.py            # Launches backend and frontend automatically
├── requirements.txt            # python backend requirements
└── README.md              # This file
```

---

## Functionality

### Motivation

The project was heavily inspired by this [repo](https://github.com/4x1md/sds1004x_bode). The problem with the newer SDS8XX Oscilloscopes is, that the external AWGs arent connected via LAN. I could have still emulated the AWG through a USB connection and let the Oscilloscope plot but decided to handle this myself. I opted to also create a nice UI that runs in browser.

### Overview

The application consists of a backend that connects to both the AWG and oscilloscope. It triggers a slow chirp signal on the Awg using serial Commands and collects measurements from the Oscilloscope with SCPI commands through USB. it then provides this data live while collecting to the frontend through FastAPI where it gets plottet.

### Backend

The Communication with the **FY6900 AWG** was allmost fully adapted from [4x1md](https://github.com/4x1md/sds1004x_bode). Some changes were made for it to run on Windows but other FeelElec AWG Modells should work without big modifications. Refer to [FY6900 Communication Protocol](https://supereyes.ru/img/instructions/FY6900_communication_protocol.pdf?srsltid=AfmBOorWS2P9UjkWTez11yoVEVBUavFbX-o_DZdQJsdIBYIyyjJyDmpA) for more details. Changing parmeters is quite slow and is the main limiter of speed in this project.

The **SDS8XX Oscilloscope** was connected using USB although SCPI should also work over LAN. I used the pyvisa package. Siglent provide a [Programming Guide](https://siglentna.com/wp-content/uploads/dlm_uploads/2017/10/ProgrammingGuide_forSDS-1-1.pdf) for the SCPI commands which still work for newer modells. I quickly noticed that it is only possible to read 8-Bit values even though the SDS8XX is 12-Bit. Therefore I did not collect full waveforms but let the oscilloscope itself carry out the measuremnts as it uses the full resolution and is also faster by using its DSP functionalities. I then collect these and send them to the frontend. The resolution is also made better by collecting multiple samples per frequency and avaraging.

**BodePlotter** is where the whole Bode generation logic is located. given its base configurations the setup functions

- create a range of frequencies
- perform baseline setup of the AWG
- auto scale of oscilloscope on start frequency

Then a loop

1. sets new frequency on AWG
2. adjust timebase on oscilloscope
3. collect & filter samples
4. streams values to frontend

the **main** is the FastAPI server that provides all Endpoints to the frontend.

### Frontend

The frontend was generated with [v0](https://v0.dev/) in react. it runs locally for now and fetches the data through the API endpoints.
It also updates the BodePlotter instance with configurations

---

## Requirements

- Python 3.10+
- Node.js + npm
- NI-VISA Backend
- FY6900 & Siglent SDS8XX connected via USB

---

## Installation & Setup

Note that this was built on a windows machine. It should run on Linux/Mac but there might be some modifications to be made.

### 1. Clone the repo

```bash
git clone https://github.com/DennisRathgeb/SDS8XX_Bode.git
cd SDS8XX_Bode
```

### 2. Install required Software

- In order to use SCPI commands with the oscilloscope:

  [install](https://www.ni.com/de/support/downloads/drivers/download.ni-visa.html?srsltid=AfmBOooz4-QPWYYME57-Vm8_mL0iJbnQ-WhH0xDEDDWW9eKlyN8McFOj#558610) `NI-VISA Backend` (Runtime should suffice)

  Otherwise your Oscilloscope will most likely not be recognised

- To run and develop the React-based frontend:

  [install](https://nodejs.org) `node.js` & `npm`

  These are required to build and run the frontend UI.

  After installation, verify both `node` and `npm` are available in your terminal:

  ```bash
  npm --version
  node --version
  ```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

It is recommended to use a virtual environment

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

> **Note:** if that fails try `npm install --legacy-peer-deps`

---

## Run the App

A python script is provided to run both API and frontend.

```bash
python run_bode.py
```

After that a webinterface should open under [http://localhost:3000]()
The API Endpoints can be observed under [http://localhost:8000]()

---

## Web Interface Overview

- Select COM port
- Connect to AWG and Scope
- Adjust Bode settings
- Start Bode scan — plots update live

---

## API Endpoints

- `GET /status`
- `GET /ports`
- `POST /connect/awg`
- `POST /connect/scope`
- `GET /bode/params`
- `POST /bode/config`
- `GET /bode/start`

---

## Improvements

- [ ] Export to CSV / JSON
- [ ] Export to PNG
- [ ] Remove Auto Scale in the beginning

---

## Author

**Dennis Rathgeb**

---

## License

MIT
