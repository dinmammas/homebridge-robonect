**WIP**  

# Homebridge-Robonect

<img src="https://media.giphy.com/media/ORUDaRRrDv6Gct22tS/giphy.gif" width="30%" align="right"> 

Development ongoing.  AS-IS it _should_ fetch battery percentage, simulate mowing with a fan accessory, and provide an "on/off"-switch for toggling auto/home.  To activate "end of day"-mode, click the fan accessory while it's mowing.

## Usage

`npm install -g homebridge-robonect`

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
  

### Note
 * Input "HX" in capitals as robonect-card _**ONLY**_ if you have a Robonect HX! You'll get the temp from the temp sensor, rather than the battery. :)
 * PORT is optional

<<<<<<< HEAD
Discuss the plugin with me and others, [here.](https://forum.robonect.de/viewtopic.php?f=55&t=1425)
=======
Discuss the plugin with me and others, [here.](https://forum.robonect.de/viewforum.php?f=55)
>>>>>>> 1fdf2a15ad02029dbf08d0751d6298331abd52be
