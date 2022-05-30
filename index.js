var Service, Characteristic;

const fetch = require('node-fetch');
const url = require('url');

let statusJson = null;
let healthJson = null;

let setupOK = false;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-robonect", "HomebridgeRobonect", myRobo);
};

function myRobo(log, config) {
  this.config = config;
  this.log = log;

  /* URLS */

  if(typeof config.getUrl === 'string' && isValidHttpUrl(config.getUrl)){
    this.getUrl = url.parse(config.getUrl);
    setupOK = true;
  }else{
    this.log("URL not properly configured, plugin will not work.");
  }

  function isValidHttpUrl(string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  this.statusUrl = url.parse(config.getUrl + '/json?cmd=status');
  this.healthUrl = url.parse(config.getUrl + '/json?cmd=health');
  this.versionUrl = url.parse(config.getUrl + '/json?cmd=version');

  this.setAutoModeUrl = url.parse(config.getUrl + '/json?cmd=mode&mode=auto');
  this.setHomeModeUrl = url.parse(config.getUrl + '/json?cmd=mode&mode=home');
  this.setEodModeUrl = url.parse(config.getUrl + '/json?cmd=mode&mode=eod');
  this.stopUrl = url.parse(config.getUrl + '/json?cmd=stop');
  this.startUrl = url.parse(config.getUrl + '/json?cmd=start');


  /* Static config values */
  this.manufactInfo = config.mower || "Generic Mower";
  this.modelInfo = config.model || "Generic Model";
  this.serialNumberInfo = config['serial-number'] || "12345";
  this.pollingInterval = config.pollingInterval || 60;
  this.fanMode = config.fanMode || 0;

  if(this.pollingInterval < 30 || isNaN(this.pollingInterval)){
    this.pollingInterval = 60000;
  } else {
    this.pollingInterval = this.pollingInterval * 1000;
  }
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
      me.tempService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(healthJson.health.climate.temperature);
      /* Check if mower has an error */
      me.motionService.getCharacteristic(Characteristic.MotionDetected).updateValue((statusJson.status.status === 7 || statusJson.status.status === 8) ? true : false);

      /* Chatty log */
      me.log("Updating status values every " + me.pollingInterval/1000 + "s");
    }
    if(setupOK){
      populateJson(this);
      setInterval(() => { populateJson(this) }, this.pollingInterval);
    }

    this.services = [];

    /* Information Service */

    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufactInfo)
      .setCharacteristic(Characteristic.Model, this.modelInfo)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumberInfo);
    this.services.push(informationService);

    /* Switch Service */
    let switchService = new Service.Switch("Auto");
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
    let humidityService = new Service.HumiditySensor("Humidity");
    this.services.push(humidityService);

    /* Temperature Service */
    let tempService = new Service.TemperatureSensor("Temperature");
    this.services.push(tempService);

    /* Motion sensor Service */
    let motionService = new Service.MotionSensor("Mower Error");
    this.services.push(motionService);

    this.switchService = switchService;
    this.fanService = fanService;
    this.informationService = informationService;
    this.batteryService = batteryService;
    this.humidityService = humidityService;
    this.tempService = tempService;
    this.motionService = motionService;

    switchService.setPrimaryService(true);

    return this.services;

  },
  setSwitchOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      me.setModeUrl = me.setAutoModeUrl;
      me.log("Setting auto mode");
    }else{
      me.setModeUrl = me.setHomeModeUrl;
      me.fanService.getCharacteristic(Characteristic.On).updateValue(0);
      me.log("Setting home mode");
    }

    fetch(me.setModeUrl).catch(error => {
      me.log("Set Switch on error: " + error.message);
        //return next(error);
    });

    return next();
  },
  setMowerOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      if(me.switchService.getCharacteristic(Characteristic.On).value === true){
        if(me.fanMode === 1){
          me.setModeUrl = me.startUrl;
          me.log("Starting mower ");
        }else{
          me.setModeUrl = me.setAutoModeUrl;
          me.log("Setting auto mode ");
        }
      }else{
        me.fanService.getCharacteristic(Characteristic.On).updateValue(0);
        me.log("Mower not in auto mode");
        me.setModeUrl = me.setHomeModeUrl;
      }
    }else{
      if(me.fanMode === 1){
        me.setModeUrl = me.stopUrl;
        me.log("Stopping mower ");
      }else{
        me.setModeUrl = me.setEodModeUrl;
        me.log("Setting EOD mode ");
      }

      me.fanService.getCharacteristic(Characteristic.On).updateValue(0);
    }

    fetch(me.setModeUrl).catch(error => {
      me.log("Set Mower on error: " + error.message);
      //return next(error);
    });

    return next();
  }
};
