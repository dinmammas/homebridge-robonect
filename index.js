var Service, Characteristic;
const request = require('request');
const url = require('url');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-robonect", "HomebridgeRobonect", myRobo);
};

function myRobo(log, config) {
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
}

myRobo.prototype = {
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

    let humidityService = new Service.HumiditySensor("Battery level");
    humidityService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getBatteryLevelCharacteristic.bind(this));
    this.services.push(humidityService);
    
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
    

    /* If Robonect HX - fetch temp from temp sensor. Otherwise, fetch battery temp. */

    if(this.card === "HX"){
      let tempService = new Service.TemperatureSensor("Temperature");
      tempService
        .getCharacteristic(Characteristic.CurrentTemperature)
          .on('get', this.getTemperatureCharacteristic.bind(this));
      this.services.push(tempService);
      this.tempService = tempService;
    }else{
      let tempService = new Service.TemperatureSensor("Battery temperature");
      tempService
        .getCharacteristic(Characteristic.CurrentTemperature)
          .on('get', this.getBatteryTemperatureCharacteristic.bind(this));
      this.services.push(tempService);
      this.tempService = tempService;
    }

    this.informationService = informationService;
    this.batteryService = batteryService;
    this.humidityService = humidityService;
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
        me.log(error.message);
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
        me.log(error.message);
        return next(error);
      }
      var obj = JSON.parse(body);
      if(obj.status.status === 4){
        chargingStatus = 1;
      }
      me.log("Charging: " + chargingStatus);
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
        me.log(error.message);
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
        me.log(error.message);
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
        me.log(error.message);
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
        me.log(error.message);
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
        me.log(error.message);
        return next(error);
      }
      return next();
    });
  },
  getTemperatureCharacteristic: function (next) {
    const me = this;
    var temperature = 0;
    request({
        url: me.tempUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log(error.message);
        return next(temperature);
      }
      var obj = JSON.parse(body);
      temperature = obj.health.climate.temperature;
      me.log("Mower temperature: " + temperature);
      return next(null, temperature);
    });
  },
  getBatteryTemperatureCharacteristic: function (next) {
    const me = this;
    var temperature = 0;
    request({
        url: me.batteryUrl,
        method: 'GET',
    }, 
    function (error, response, body) {
      if (error) {
        me.log(error.message);
        return next(null, temperature);
      }
      var obj = JSON.parse(body);
      if(obj.battery === undefined){
        //me.log('Version is 1.0 beta 8 or newer');
        temperature = obj.batteries[0].temperature;
      }else{
        //me.log('Version is 1.0 beta 7 or older');
        temperature = obj.battery.temperature;
      }
      temperature = temperature/10;
      me.log("Battery temperature: " + temperature);
      return next(null, temperature);
    });
  }
};