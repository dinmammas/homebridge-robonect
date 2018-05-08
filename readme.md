**WIP**  

# Homebridge-Robonect

<img src="https://user-images.githubusercontent.com/27199904/39742945-a3cf53b2-529f-11e8-8c0e-1aadb7387828.png" width="30%" align="right"> 

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
  

### Note
 * Input "HX" in capitals as robonect-card _**ONLY**_ if you have a Robonect HX! There's an extra accessory for you. :)
 * PORT is optional

Discuss the plugin with me and others, [here.](http://www.robonect.de/viewtopic.php?f=55&t=1425&p=12572#p12572)