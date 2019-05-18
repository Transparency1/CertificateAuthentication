var Award = artifacts.require("Award");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(Award);
};