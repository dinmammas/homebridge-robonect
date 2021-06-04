# Homebridge-Robonect
[![Downloads](https://img.shields.io/npm/dt/homebridge-robonect.svg?color=critical)](https://www.npmjs.com/package/homebridge-robonect)
[![Version](https://img.shields.io/npm/v/homebridge-robonect)](https://www.npmjs.com/package/homebridge-robonect)<br>
<img src="https://i.postimg.cc/QxQwrNV3/IMG-1446.png" width="30%" align="right"> 

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
		"pollingInterval": time-in-seconds,  
		"getUrl": "http://USER:PASS@SERVER:PORT"  
	}  
  

  |     Parameter |        Description      |  Default |   type   |  Optional |
|:--------------|:------------------------|:--------:|:--------:|------------:|
| `accessory`  | always `"HomebridgeRobonect"` |     ""    |  String  | no    |
| `name`      | The name of your mower, as you want it to appear in the Home App  | ""    |  String  |no |
| `make`  | The manufacturer of your mower. I.e. "Husqvarna" or "Gardena"   |  "" |  String |no |
| `model`       |  Your mower model. I.e. "Automower 305"        |  "" |  String  |no |
| `robonect-card`        | Robonect card type. Either "H30x" or "HX". Note - H30x is only supported in versions 1.0.22 or older. |    ""     |  String  |no |
| `serial-number`        | The serial number of you mower|  ""  |  String  |no |
| `show-humidity`| Set to either yes or no, to enable the humidity sensor (valid for version 1.0.22 or older) | "yes" |  String  | yes |
|`pollingInterval`| Set the interval for polling the mower. Cannot be set lower than 30s. | 60 | int | yes |
| `getUrl` | The URL to your mower. PORT is optional. | "" | String | no |

### Note
 * Input "HX" in capitals as robonect-card _**ONLY**_ if you have a Robonect HX! You'll get the temp from the temp sensor, rather than the battery. :)

Discuss the plugin with me and others, [here.](https://forum.robonect.de/viewforum.php?f=55)