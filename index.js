var Service, Characteristic;
const request = require('request');
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
   
      request({
        url: this.versionUrl,
        method: 'GET',
      }, 
      function (error, response, body) {
        if (error) {
          me.log("Unable to fetch setup data: " + error.message);
          return (error);
        }
        jsonInfo = JSON.parse(body);
        jsonInfoAvailable = true;
        firmwareVersion = parseFloat(jsonInfo.application.version.substring(1,4));
        me.log("============================");
        me.log(" ");
        me.log("Robonect and mower connected");
        me.log("Mower Model: " + jsonInfo.mower.msw.title);
        me.log("Mower serial number: " + jsonInfo.mower.hardware.serial);
        me.log("Robonect firmware version: " + jsonInfo.application.version);
       if( firmwareVersion >= 1.2){
          me.log("Robonect card type: " + jsonInfo.robonect.version);
          isModern = true;
        }
        me.getMowerStatus();
      });
      
  },
  getMowerStatus: function(){
    const me = this;
    request({
      url: this.statusUrl,
      method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log("Gick ej att hämta versionsdata" + error.message);
        return (error);
      }
      obj = JSON.parse(body);
      mowerName = obj.name;
      me.log("Mower name: "+ mowerName);
      me.log(" ");
      me.log("============================");
    });
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

    request({
        url: me.statusUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log("BattLevel error: " + error.message);
        return next(error);
      }
      var obj = JSON.parse(body);
      me.log("Battery level: " + obj.status.battery);
      return next(null, obj.status.battery);
    }); 
  },
  getChargingStateCharacteristic: function (next) {
    const me = this;
    request({
        url: me.statusUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      var chargingStatus = 0;
      if (error) {
        me.log("Charge State error: " + error.message);
        return next(error);
      }
      var obj = JSON.parse(body);
      if(obj.status.status === 4){
        chargingStatus = 1;
      }
      if(chargingStatus > 0){
        me.log("Charging");
      }
      return next(null, chargingStatus);
    });
  },
  getLowBatteryCharacteristic: function (next) {
    const me = this;
    request({
        url: me.statusUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log("Low Battery error: " + error.message);
        return next(error);
      }
      var obj = JSON.parse(body);
      if(obj.status.battery < 20){
        return next(null, 1);
        me.log("MOWER HAS LOW BATTERY!");
      }else{
        return next(null, 0);
      }
    });
  },
  getSwitchOnCharacteristic: function (next) {
    const me = this;
    var onn = false;
    request({
        url: me.statusUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log("Get Switch on error: " + error.message);
        return next(error);
      }
      var obj = JSON.parse(body);
      if(obj.status.mode === 0 || obj.status.mode === 1){
        onn = true;
      }
      return next(null, onn);
    });
  },  
  setSwitchOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      me.setModeUrl = me.setAutoModeUrl;
    }else{
      me.setModeUrl = me.setHomeModeUrl;
    }
    request({
      url: me.setModeUrl,
      method: 'GET',
    },
    function (error, response) {
      if (error) {
        me.log("Set Switch on error: " + error.message);
        return next(error);
      }
      return next();
    });
  },
  getMowerOnCharacteristic: function (next) {
    const me = this;
    var mowing = 0;
    request({
        url: me.statusUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log("Get Mower On error: " + error.message);
        return next(error);
      }
      var obj = JSON.parse(body);
      if(obj.status.status === 2 || obj.status.status === 5){
        mowing = 1;
      }
      return next(null, mowing);
    });
  },
  setMowerOnCharacteristic: function (on, next) {
    const me = this;
    if(on){
      me.setModeUrl = me.setAutoModeUrl;
    }else{
      me.setModeUrl = me.setEodModeUrl;
    }
    request({
        url: me.setModeUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log("Set Mower On error: " + error.message);
        return next(error);
      }
      return next();
    });
  },
  getTemperatureCharacteristic: function (next) {
    const me = this;
    var type;
    
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
    var temperature = 0;
    if(type === "HX"){
      request({
        url: me.tempUrl,
        method: 'GET',
      }, 
      function (error, response, body) {
        if (error) {
          me.log("Get temperature error: " + error.message);
          return next(temperature);
        }
        var obj = JSON.parse(body);
        temperature = obj.health.climate.temperature;
        me.log("Mower temperature: " + temperature);
        return next(null, temperature);
      });
    }else{
      request({
        url: me.batteryUrl,
        method: 'GET',
      }, 
      function (error, response, body) {
        if (error) {
          me.log("Get battery temperature error: " + error.message);
          return next(null, temperature);
        }
        var obj = JSON.parse(body);
        if(obj.battery === undefined){
          temperature = obj.batteries[0].temperature;
        }else{
          temperature = obj.battery.temperature;
        }
        temperature = temperature/10;
        me.log("Battery temperature: " + temperature);
        return next(null, temperature);
      });
    }    
  }
};