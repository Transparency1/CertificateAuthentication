pragma solidity >=0.5.0 <0.7.0;

contract Award{

	address payable institution; // account address of institution

	event degree_award(address student, address payable institution, string file_hash);

	address[] public institutions;

	address public deployer;

	constructor () public{
	    deployer = msg.sender;
	}

	modifier onlyInstitution(address institutionA){
	    bool isInstitution = false;
		for(uint i = 0; i < institutions.length; i ++){
			if (institutions[i] == institutionA){
				isInstitution = true;
			}
		}
		require(isInstitution == true, "This is not an institution account");
		_;
	}
	modifier onlyDeployer(){
	    require(msg.sender == deployer, "This is not the deployer account");
	    _;
	}


	function addInstitution(address institutionAddr) public onlyDeployer{
	    institutions.push(institutionAddr);
	}

	function publish(address student_addr,string memory file_hash)
		public payable onlyInstitution(msg.sender) {
			address payable institution_addr = msg.sender;
			institution_addr.transfer(0);
			emit degree_award(student_addr, institution_addr, file_hash);
	}

}