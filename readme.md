# Homebridge-Robonect
[![Downloads](https://img.shields.io/npm/dt/homebridge-robonect.svg?color=critical)](https://www.npmjs.com/package/homebridge-robonect)
[![Version](https://img.shields.io/npm/v/homebridge-robonect)](https://www.npmjs.com/package/homebridge-robonect)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)<br>
<img src="https://i.postimg.cc/QxQwrNV3/IMG-1446.png" width="30%" align="right">

**This plugin will:**
* Fetch battery level / low battery warning
* Fetch charging status
* Simulate mowing with a fan accessory (tap to toggle mode when running (see config table))
* Provide an "on/off"-switch for toggling auto or home mode.  

## Usage

`npm install -g homebridge-robonect`   

**NB** Robonect H30x-users, see below for instructions.

Config as follows:  

	{  
		"accessory": "HomebridgeRobonect",  
		"name": "name-of-your-mower",  
		"mower": "Mower make",  
		"model": "Mower Model",
		"serial-number": "Serialnr of your mower",
		"pollingInterval": time-in-seconds,  
		"getUrl": "http://USER:PASS@SERVER:PORT"  
	}  


| Parameter | Description | Default | Type |Optional |
|:--|:--|:-:|:-:|:-:|
| `accessory`    | Always `"HomebridgeRobonect"` |     ""    |  String  | no    |
| `name`          | The name of your mower, as you want it to appear in the Home App  | ""  |  String  |no |
| `mower`          | The manufacturer of your mower. I.e. "Husqvarna" or "Gardena"   |  "" |  String |yes* |
| `model`         |  Your mower model. I.e. "Automower 305"        |  "" |  String  |yes* |
| `serial-number` | The serial number of you mower|  ""  |  String  |yes* |
|`pollingInterval`| Set the interval for polling the mower. Cannot be set lower than 30s. | 60 | int | yes |
|`fanMode`| Choose what toggling the fan off/on should do. `0 = eod/auto`, `1 = stop/start` | 0 | int | yes |
|`showHealth`| Choose whether you want to show the temperature and humidity sensors. `1 = show, 2 = don't show` | 1 | int | yes |
| `getUrl`        | The URL to your mower. PORT is optional. | "" | String | no |

 *Only optional in versions >1.1.10

#### Robonect H30x users

Robonect H30x is only supported in version 1.0.22 and older, which can be installed using `npm -g install homebridge-robonect@1.0.22`
Additional options to configure are:
| Parameter | Description | Default | Type |Optional |
|:--|:--|:-:|:-:|:-:|
| `show-humidity` | Set to either yes or no, to enable the humidity sensor (valid for version 1.0.22 or older) | "yes" |  String  | yes |
| `robonect-card` | Robonect card type. Either "H30x" or "HX".|    ""     |  String  |no |

Discuss the plugin with me and others, [here.](https://forum.robonect.de/viewforum.php?f=55)
