var Service, Characteristic;
const fetch = require('node-fetch');
const url = require('url');
let jsonInfo = "";
let jsonInfoAvailable = false;
let isModern = false;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-robonect", "HomebridgeRobonect", myRobo);
};

function myRobo(log, config) {
  this.config = config;
  this.log = log;
  this.getUrl = url.parse(config['getUrl']);
  this.statusUrl = url.parse(config['getUrl'] + '/json?cmd=status');
  this.setAutoModeUrl = url.parse(config['getUrl'] + '/json?cmd=mode&mode=auto');
  this.setHomeModeUrl = url.parse(config['getUrl'] + '/json?cmd=mode&mode=home');
  this.setEodModeUrl = url.parse(config['getUrl'] + '/json?cmd=mode&mode=eod');
  this.batteryUrl = url.parse(config['getUrl'] + '/json?cmd=battery');
  this.manufactInfo = config['mower'] + "/Robonect";
  this.modelInfo = config['model'] + "/" + config['robonect-card'];
  this.serialNumberInfo = config['serial-number'];
  this.card = config['robonect-card'];
  this.tempUrl = url.parse(config['getUrl'] + '/json?cmd=health');
  this.versionUrl = url.parse(config['getUrl'] + '/json?cmd=version');
  this.showHumidity = config['show-humidity'];
  this.getCardInfo();
 }

myRobo.prototype = {
  getCardInfo: function () {
    const me = this;
    me.log("Querying Robonect for setup data");
    fetch(this.versionUrl)
    .then(res => res.json())
    .then(json => cardInfoSub(json));
      
    function cardInfoSub(json) {
      jsonInfo = json;
      jsonInfoAvailable = true;
      firmwareVersion = parseFloat(jsonInfo.application.version.substring(1,4));
      try{
        me.log("============================");
        me.log(" ");
        me.log("Robonect and mower connected");
        me.log("Mower Model: " + jsonInfo.mower.msw.title);
        me.log("Mower serial number: " + jsonInfo.mower.hardware.serial);
        me.log("Robonect firmware version: " + jsonInfo.application.version);
       if( firmwareVersion >= 1.2){
          me.log("Robonect card type: " + jsonInfo.robonect.version);
          isModern = true;
        }else{
          me.log("The Robonect firmware is old, consider updating.");
        }
        me.getMowerStatus();
      }catch(error){
        me.log("Something went wrong when fetching setup data.");
      }
    }
  },
  getMowerStatus: function(){
    const me = this;
    fetch(this.statusUrl)
    .then(res => res.json())
    .then(json => mowerStatSub(json));

    function mowerStatSub(json){
      try{
        me.log("Mower name: "+ json.name);
        me.log(" ");
        me.log("============================");
      }catch(error){
        me.log("Unable to fetch setup data: " + error.message);
      }
    }
  },

  getServices: function () {
    this.services = [];

    /* Information Service */

    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufactInfo)
      .setCharacteristic(Characteristic.Model, this.modelInfo)
      .setCharacteristic(Characteristic.SerialNumber, this.serialNumberInfo);
    this.services.push(informationService);
    
    /* Battery Service */

    let batteryService = new Service.BatteryService();
    batteryService
      .getCharacteristic(Characteristic.BatteryLevel)
        .on('get', this.getBatteryLevelCharacteristic.bind(this));
    batteryService
      .getCharacteristic(Characteristic.ChargingState)
        .on('get', this.getChargingStateCharacteristic.bind(this));
    batteryService
      .getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', this.getLowBatteryCharacteristic.bind(this));
    this.services.push(batteryService);
    
    /* Humidity Service */
    if(this.showHumidity !== "no"){
      let humidityService = new Service.HumiditySensor("Battery level");
      humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .on('get', this.getBatteryLevelCharacteristic.bind(this));
      this.services.push(humidityService);
      this.humidityService = humidityService;
    }
    
    /* Switch Service */

    let switchService = new Service.Switch("Auto/Home");
    switchService
      .getCharacteristic(Characteristic.On)
        .on('get', this.getSwitchOnCharacteristic.bind(this))
        .on('set', this.setSwitchOnCharacteristic.bind(this));
    this.services.push(switchService);
    
    /* Fan Service */

    let fanService = new Service.Fan("Mowing");
    fanService
      .getCharacteristic(Characteristic.On)
        .on('get', this.getMowerOnCharacteristic.bind(this))
        .on('set', this.setMowerOnCharacteristic.bind(this));
    this.services.push(fanService);
    
    /* Temperature service */

    let tempService = new Service.TemperatureSensor("Temperature");
    tempService
      .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getTemperatureCharacteristic.bind(this));
    this.services.push(tempService);
    

    this.tempService = tempService;
    this.informationService = informationService;
    this.batteryService = batteryService;
    
    this.switchService = switchService;
    this.fanService = fanService;

    return this.services;

  },
  getBatteryLevelCharacteristic: function (next) {
    const me = this;
    fetch(this.statusUrl)
    .then(res => res.json())
    .then(json => blSub(json));

    function blSub(json){
      try{
        me.log("Battery level: " + json.status.battery);
        return next(null, json.status.battery);
      }catch(error){
        me.log("BattLevel error: " + error.message);
        return next(error);
      }
    }
  },
  getChargingStateCharacteristic: function (next) {
    const me = this;
    fetch(this.statusUrl)
    .then(res => res.json())
    .then(json => csSub(json));

    function csSub(json) {
      var chargingStatus = 0;
      try{
        if(json.status.status === 4){
          chargingStatus = 1;
        }
        if(chargingStatus > 0){
          me.log("Charging");
        }
      }catch(error){
        me.log("Charge State error: " + error.message);
        return next(error);
      }
      return next(null, chargingStatus);
    }
  },
  getLowBatteryCharacteristic: function (next) {
    const me = this;
    fetch(this.statusUrl)
    .then(res => res.json())
    .then(json => lbSub(json));

    function lbSub(json){
      try{
        if(json.status.battery < 20){
          return next(null, 1);
          me.log("MOWER HAS LOW BATTERY!");
        }else{
          return next(null, 0);
        }
      }catch(error){
        me.log("Low Battery error: " + error.message);
        return next(error);
      }
    }
  },
  getSwitchOnCharacteristic: function (next) {
    const me = this;
    var onn = false;
    fetch(this.statusUrl)
    .then(res => res.json())
    .then(json => gswOnSub(json));

    function gswOnSub(json){
      try{
        if(json.status.mode === 0 || json.status.mode === 1){
          onn = true;
          me.log("SwitchOn: " + json.status.mode);
        }
      }catch(error){
        me.log("Get Switch on error: " + error.message);
        return next(error);
      }
      return next(null, onn);
    }
  },  
  setSwitchOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      me.setModeUrl = me.setAutoModeUrl;
    }else{
      me.setModeUrl = me.setHomeModeUrl;
    }

    fetch(me.setModeUrl).catch(error => {
      me.log("Set Switch on error: " + error.message);
        return next(error);
    });

    return next();
  },
  getMowerOnCharacteristic: function (next) {
    const me = this;
    var mowing = 0;
    fetch(this.statusUrl)
    .then(res => res.json())
    .then(json => gmOnSub(json));
    
    function gmOnSub (json) {
      try{
        if(json.status.status === 2 || json.status.status === 5){
          mowing = 1;
        }
      }catch(error){
        me.log("Get Mower On error: " + error.message);
        return next(error);
      }
      return next(null, mowing);
    }
  },
  setMowerOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      me.setModeUrl = me.setAutoModeUrl;
    }else{
      me.setModeUrl = me.setEodModeUrl;
    }

    fetch(me.setModeUrl).catch(error => {
      me.log("Set Mower on error: " + error.message);
        return next(error);
    });
    
    return next();
  },
  getTemperatureCharacteristic: function (next) {
    const me = this;
    var type;
    var temperature = 0;
    
    if(jsonInfoAvailable){
      if(isModern){
        if(jsonInfo.robonect.version === "Robonect H30x"){
          type = "H30x";
        }else{
          type = "HX";
        }
      }else{
        type = me.card;
      }
    }

    if(type === "HX"){
      fetch(this.tempUrl)
      .then(res => res.json())
      .then(json => getTemp(json));

      function getTemp(json){
        try{
         temperature = json.health.climate.temperature;
          return next(null, temperature);
        }catch(error){
          me.log("Get temperature error: " + error.message);
          return next(temperature);
        }
      }
    }else{
      fetch(this.batteryUrl)
      .then(res => res.json())
      .then(json => getBatteryTemp(json));
      
      function getBatteryTemp(json){
        try{
          if(json.battery === undefined){
            temperature = json.batteries[0].temperature;
          }else{
            temperature = json.battery.temperature;
          }
          return next(null, temperature);
        }catch(error){
          me.log("Get temperature error: " + error.message);
          return next(temperature);
        }
      }
    }
  }
};