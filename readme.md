# Homebridge-Robonect

<img src="https://media.giphy.com/media/ORUDaRRrDv6Gct22tS/giphy.gif" width="30%" align="right"> 

Development ongoing.

**This plugin will:**
* Fetch battery level / low battery warning
* Fetch charging status
* Simulate mowing with a fan accessory
* Provide an "on/off"-switch for toggling auto or home mode.  

To activate "end of day"-mode, click the fan accessory while it's mowing.

## Usage

`npm install -g homebridge-robonect`   

**NB** Version 1.0.22 is the last one to support Robonect H30x. Install using  
`npm install -g homebridge-robonect@1.0.22`

Config as follows:  

	{  
		"accessory": "HomebridgeRobonect",  
		"name": "name-of-your-mower",  
		"mower": "Mower make",  
		"model": "Mower Model",  
		"robonect-card": "H30x or HX",  
		"serial-number": "Serialnr of your mower",  
		"show-humidity": "yes or no",  
		"getUrl": "http://USER:PASS@SERVER:PORT"  
	}  
  

### Note
 * Input "HX" in capitals as robonect-card _**ONLY**_ if you have a Robonect HX! You'll get the temp from the temp sensor, rather than the battery. :)
 * PORT and show-humidity is optional and is only used in plugin version 1.0.22 and older

Discuss the plugin with me and others, [here.](https://forum.robonect.de/viewforum.php?f=55)