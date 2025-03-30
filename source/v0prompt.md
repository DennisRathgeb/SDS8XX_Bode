Create a User interface in react for Plotting A Bode Plot.
it is a modern UI with a header and a main body:
header consists of a AWG part and a Scope part

- awg part has the title AWG and consits of a dropdown where prorts can be selected, a a small"refresh ports" button with a refresh icon which is to the left of the dropdown. then a "connect awg" button that is eighter a button with text CONNECT or just a green text "connected". this button is to the right af this awg section

- Scope section that has texttitle SCOPE and a button to the right of it called "connect scope" the text is also connect and if the scope is connected it transforms into text like awg.

The body section starts with a big button "run Bode" it is green when available and when not greyed out and unclickable
then two plots on top of each other: first gain plot and then phase plot. it is almost full with. it is downloadable with a small save button next to it(icon)
then there is a setting section:
first there is a slider where both ends can be adjusted. it starts at 10 and ends at 99999999 below the slider there is a textfield where the left and right value of the slider can be adjusted if the slider moves the textfield adjusts and vise versa the left value is called start freq and the right end freq. this slider has a title called Frequency range then there are different textfields which can all be adjusted: first Bode resolution("num_points") then
"n_samples": Samples per Frequency
"amplitude": Amplitude
"tolerance": Tolerance they are all labled with text.

### Flow

---

### On Page Load or **“Refresh Ports”** Button

- `GET /ports` → Populate dropdown with available COM ports
- `GET /status` → Update:
  - AWG: connected / disconnected
  - Scope: connected / disconnected
  - Bode: ready / not_ready

---

### User Selects Port + Clicks **“Connect AWG”**

- `POST /connect/awg` with body:
  ```json
  { "port": "COMX" }
  ```
- `Then GET /status` to refresh UI state

### User Clicks “Connect Scope”

- POST /connect/scope

- Then GET /status to refresh

Enable “Run Bode” Button only if:
GET /status returns
{
"awg": "connected",
"scope": "connected",
"bode": "ready"
}
If "Run Bode" Button is Clicked:

1. POST /bode/config with:
   {
   "start_freq": slider start text field,
   "stop_freq": slider stop text field,
   "num_points": Bode resolution text field,
   "n_samples": samples per frequency text field,
   "amplitude": amplitude text field,
   "tolerance": tolerance text field
   }
2. Then GET /bode/start
   This returns a text/event-stream like:
   data: {"freq": 1234.5, "gain": 0.87, "phase": 42.0}

3. Update plot live as values stream in

lotting in V0
Chart 1: Gain
x-axis: Frequency (Hz), log scale

y-axis: Gain in dB
gain_dB = 20 \* log10(gain)

Chart 2: Phase
x-axis: Frequency (Hz), log scale (same as above)

y-axis: Phase (degrees), range -180° to +180°

Update both charts live as data arrives from the stream.
