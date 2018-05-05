**WIP**  
Development ongoing.  AS-IS it _should_ fetch battery percentage, simulate mowing with a fan accessory, and provide an "on/off"-switch for toggling auto/home.  To activate "end of day"-mode, click the fan accessory while it's mowing.

Config as below:  

{  
	"accessory": "HomebridgeRobonect",  
	"name": "name-of-your-mower",  
	"mower": "Mower make",  
	"model": "Mower Model",  
	"robonect-card": "H30x or HX",  
	"serial-number": "Serialnr of your mower",  
	"getUrl": "http://USER:PASS@SERVER:PORT"  
}  
  

**Note** If you have a Robonect HX, input "HX" in capitals as robonect-card. There's an extra accessory for you. :)