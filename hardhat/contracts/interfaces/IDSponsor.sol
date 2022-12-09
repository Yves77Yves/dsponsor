// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IDSponsor {
    event NewSponsoData(
        uint256 indexed tokenId,
        string indexed property,
        string data
    );
    event NewSponsoDataValidation(
        uint256 indexed tokenId,
        string indexed property,
        bool indexed validated,
        string data,
        string reason
    );
    event PropertyUpdate(string indexed property, bool indexed allowed);
    
    event ValidityPeriodUpdate(uint256 start, uint256 end); 
     

    error NoDataSubmitted();
    error SponseeCannotBeZeroAddress();
    error StringLengthExceedLimit();
    error UnallowedProperty();
    error UnallowedSponsorOperation();

    function setProperty(string memory propertyString, bool allowed) external;

    function setValidityPeriod(uint256 start, uint256 end) external;


    function setSponsoData(
        uint256 tokenId,
        string memory property,
        string memory data
    ) external;

    function setSponsoDataValidation(
        uint256 tokenId,
        string memory property,
        bool validated,
        string memory reason
    ) external;

    function getAccessContract() external view returns (address);

    function getSponsoData(uint256 tokenId, string memory propertyString)
        external
        view
        returns (
            string memory lastDataValidated,
            string memory lastDataSubmitted,
            string memory lastRejectionReason
        );

        
    function getStartPeriod() external returns (uint);
    
    function getEndPeriod() external returns (uint);

    function isAllowedProperty(string memory propertyString)
        external
        view
        returns (bool);
}
