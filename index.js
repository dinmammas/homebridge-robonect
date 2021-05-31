var Service, Characteristic;

const fetch = require('node-fetch');
const url = require('url');

let statusJson = null;
let healthJson = null;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-robonect", "HomebridgeRobonect", myRobo);
};

function myRobo(log, config) {
  this.config = config;
  this.log = log;

  /* URLS */
  this.getUrl = url.parse(config.getUrl);
  
  this.statusUrl = url.parse(config.getUrl + '/json?cmd=status');
  this.healthUrl = url.parse(config.getUrl + '/json?cmd=health');
  this.versionUrl = url.parse(config.getUrl + '/json?cmd=version');

  this.setAutoModeUrl = url.parse(config.getUrl + '/json?cmd=mode&mode=auto');
  this.setHomeModeUrl = url.parse(config.getUrl + '/json?cmd=mode&mode=home');
  this.setEodModeUrl = url.parse(config.getUrl + '/json?cmd=mode&mode=eod');
  
  /* Static config values */
  this.manufactInfo = config.mower + "/Robonect";
  this.modelInfo = config.model + "/" + config['robonect-card'];
  this.serialNumberInfo = config['serial-number'];
  this.card = config['robonect-card'];
 }

myRobo.prototype = {
  
  getServices: function () {
    async function populateJson(me) {
      try{
        const response1 = await fetch(me.statusUrl);
        statusJson = await response1.json();
        const response2 = await fetch(me.healthUrl);
        healthJson = await response2.json();
        await updateDevices(me);
      }catch(err){
        me.log("Could not fetch status values :( " + err);
      }
    }

    function updateDevices(me){
      
      /* Is mower in auto or home mode */
      me.switchService.getCharacteristic(Characteristic.On).updateValue((statusJson.status.mode === 0 || statusJson.status.mode === 1) ? true : false);
      /* Is mower mowing */
      me.fanService.getCharacteristic(Characteristic.On).updateValue((statusJson.status.status === 2 || statusJson.status.status === 5) ? 1 : 0);
      /* Update battery level */
      me.batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(statusJson.status.battery);
      /* Update charging status */
      me.batteryService.getCharacteristic(Characteristic.ChargingState).updateValue((statusJson.status.status == 4) ? 1 : 0);
      /* Update low battery warning */ 
      me.batteryService.getCharacteristic(Characteristic.StatusLowBattery).updateValue((statusJson.status.battery < 20) ? 1 : 0);
      /* Update humidity level */
      me.humidityService.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(healthJson.health.climate.humidity);
      /* Update temperature */
      tempService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(healthJson.health.climate.temperature);

      /* Chatty log */
      me.log("Updating status values");
    }

    populateJson(this);
    setInterval(() => { populateJson(this) }, 60000);

    this.services = [];

    /* Information Service */

    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufactInfo)
      .setCharacteristic(Characteristic.Model, this.modelInfo)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumberInfo);
    this.services.push(informationService);

    /* Switch Service */
    let switchService = new Service.Switch("Auto/Home");
    switchService
      .getCharacteristic(Characteristic.On).on('set', this.setSwitchOnCharacteristic.bind(this));
    this.services.push(switchService);

     /* Fan Service */
    let fanService = new Service.Fan("Mowing");
    fanService
      .getCharacteristic(Characteristic.On)
        .on('set', this.setMowerOnCharacteristic.bind(this));
    this.services.push(fanService);

    /* Battery Service */
    let batteryService = new Service.BatteryService();      
    this.services.push(batteryService);

    /* HumidityService */
    let humidityService = new Service.HumiditySensor("Battery level");
    this.services.push(humidityService);

    /* Temperature Service */
    let tempService = new Service.TemperatureSensor("Temperature");
    this.services.push(tempService);

    

    this.humidityService = humidityService;
    this.switchService = switchService;
    this.fanService = fanService;
    this.informationService = informationService; 
    this.batteryService = batteryService;
    this.humidityService = humidityService;
    this.tempService = tempService;
    return this.services;

  },  
  setSwitchOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      me.setModeUrl = me.setAutoModeUrl;
      me.log("Setting auto mode");
    }else{
      me.setModeUrl = me.setHomeModeUrl;
      me.log("Setting home mode");
    }

    fetch(me.setModeUrl).catch(error => {
      me.log("Set Switch on error: " + error.message);
        return next(error);
    });

    return next();
  },
  setMowerOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      me.setModeUrl = me.setAutoModeUrl;
      me.log("Setting auto mode");
    }else{
      me.setModeUrl = me.setEodModeUrl;
      me.log("Setting EOD mode");
    }

    fetch(me.setModeUrl).catch(error => {
      me.log("Set Mower on error: " + error.message);
        return next(error);
    });
    
    return next();
  }
};